import { useState, useRef } from "react";
import { extractRecipeFromPhotos, photoSrc, MAX_PHOTOS } from "../../Services/RecipePhoto.js";
import "./PhotoUpload.css";

// Settings for the upload check
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;    // reject anything bigger than this before processing
const MAX_WIDTH = 1500;    // shrink large phone photos to this width
const JPEG_QUALITY = 0.8;

// What to tell the user for each reason the cloud function can return
const REASON_TIPS = {
  blurry: {
    title: "The photo is blurry",
    tip: "Hold your phone steady, tap the screen to focus, and check the text is sharp before taking the photo.",
  },
  cut_off: {
    title: "Part of the recipe is cut off",
    tip: "Step back so the whole recipe, including all four edges of the page, fits in the frame.",
  },
  too_dark: {
    title: "The photo is too dark",
    tip: "Move somewhere brighter or turn on the flash, and avoid casting a shadow over the page.",
  },
  glare: {
    title: "Glare is hiding the text",
    tip: "Tilt the page or your phone slightly to get rid of reflections, or turn off the flash.",
  },
  too_small: {
    title: "The text is too small to read",
    tip: "Move closer, or take one photo per recipe instead of a whole page of them.",
  },
  handwriting_illegible: {
    title: "The handwriting is hard to read",
    tip: "Try a closer, well-lit photo. If it still can't be read, type the unclear parts into the form yourself.",
  },
  not_a_recipe: {
    title: "No recipe found",
    tip: "We couldn't find a recipe in this photo. Check that you picked the right picture.",
  },
  other: {
    title: "We couldn't read this photo",
    tip: "Try a clearer, well-lit photo of the whole recipe taken straight on.",
  },
  error: {
    title: "Something went wrong",
    tip: "The recipe reader didn't respond. Check your connection and try again.",
  },
};

// Shrinks the image with a canvas and returns it as base64 JPEG.
function resizeToBase64(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width); // never enlarge
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      URL.revokeObjectURL(url);

      resolve({
        base64: dataUrl.split(",")[1], // drop the "data:image/jpeg;base64," prefix
        mediaType: "image/jpeg",
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}

// Gives each photo a stable id so the list can be reordered
let nextPhotoId = 1;

// Lets the user pick photos of a recipe (one or several pages) and sends them
// to Claude through Back4App Cloud Code. The photos live in the parent (Main),
// so they can be shown beside the form and saved with the recipe.
//   photos             array of { id, base64, mediaType }, in page order
//   onPhotosChange     called with the new array
//   onRecipeExtracted  called with the recipe fields Claude read
//   reviewing          true while the parent shows the photos beside the form
export default function PhotoUpload({ photos, onPhotosChange, onRecipeExtracted, reviewing }) {
  const [error, setError] = useState("");           // problems with the chosen files
  const [failure, setFailure] = useState(null);     // { reason, page } when reading failed
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const inputRef = useRef(null);
  // Index of the page being replaced, or null when new photos are added at the end
  const replaceIndexRef = useRef(null);

  const isBusy = isProcessing || isExtracting;
  const roomLeft = MAX_PHOTOS - photos.length;

  // Any change to the set of photos makes an earlier failure out of date
  function updatePhotos(next) {
    setFailure(null);
    onPhotosChange(next);
  }

  function openPicker(replaceIndex = null) {
    replaceIndexRef.current = replaceIndex;
    inputRef.current?.click();
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    e.target.value = ""; // lets the same file be picked again later
    const replaceIndex = replaceIndexRef.current;
    replaceIndexRef.current = null;
    if (files.length === 0) return;

    setError("");
    const problems = [];

    const valid = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        problems.push(`${file.name} isn't a JPEG, PNG or WebP photo.`);
        return false;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        problems.push(`${file.name} is over ${MAX_SIZE_MB} MB.`);
        return false;
      }
      return true;
    });

    // Replacing a page frees up its slot
    const room = replaceIndex === null ? roomLeft : roomLeft + 1;
    const accepted = valid.slice(0, room);
    if (valid.length > accepted.length) {
      problems.push(`You can add up to ${MAX_PHOTOS} photos; extra ones were skipped.`);
    }
    if (accepted.length === 0) {
      setError(problems.join(" "));
      return;
    }

    setIsProcessing(true);
    const results = await Promise.allSettled(accepted.map(resizeToBase64));
    setIsProcessing(false);

    const added = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        added.push({ id: nextPhotoId++, ...result.value });
      } else {
        problems.push(`Couldn't read ${accepted[i].name}.`);
      }
    });
    setError(problems.join(" "));
    if (added.length === 0) return;

    const next = [...photos];
    if (replaceIndex === null) {
      next.push(...added);
    } else {
      next.splice(replaceIndex, 1, ...added);
    }
    updatePhotos(next);
  }

  // Move a page one place earlier (-1) or later (+1)
  function movePhoto(index, direction) {
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(index + direction, 0, moved);
    updatePhotos(next);
  }

  function removePhoto(index) {
    updatePhotos(photos.filter((_, i) => i !== index));
  }

  function removeAll() {
    setError("");
    updatePhotos([]);
  }

  // Also used by "Try again": the same photos are sent again
  async function handleSubmit() {
    if (photos.length === 0) return;
    setError("");
    setFailure(null);
    setIsExtracting(true);

    try {
      const result = await extractRecipeFromPhotos(photos);
      if (result.ok) {
        onRecipeExtracted(result.recipe);
      } else {
        setFailure({
          reason: REASON_TIPS[result.reason] ? result.reason : "other",
          page: result.page || 0,
        });
      }
    } catch (err) {
      console.error("Error reading recipe photos:", err);
      setFailure({ reason: "error", page: 0 });
    } finally {
      setIsExtracting(false);
    }
  }

  const tip = failure && REASON_TIPS[failure.reason];
  const failedPage = failure?.page && failure.page <= photos.length ? failure.page : 0;
  const plural = photos.length === 1 ? "photo" : "photos";

  return (
    <div className="photo-upload">
      <p className="photo-upload-label">
        Upload photos of a recipe (up to {MAX_PHOTOS}, one per page)
      </p>
      <input
        id="recipe-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        ref={inputRef}
        onChange={handleFileChange}
        hidden
      />

      {/* While reviewing, the photos are shown beside the form instead */}
      {reviewing ? (
        <div className="photo-upload-done">
          <p>
            {photos.length} {plural} read. Check the highlighted fields against the{" "}
            {photos.length === 1 ? "picture" : "pictures"}.
          </p>
          <button type="button" className="photo-upload-secondary" onClick={removeAll}>
            Change photos
          </button>
        </div>
      ) : (
        photos.length === 0 && (
          <div className="photo-upload-actions">
            <button type="button" onClick={() => openPicker()} disabled={isBusy}>
              Choose photos
            </button>
          </div>
        )
      )}

      {isProcessing && <p className="photo-upload-status">Preparing photos...</p>}
      {error && <p className="photo-upload-error">{error}</p>}

      {photos.length > 0 && !reviewing && (
        <div className="photo-upload-preview">
          <ol className="photo-upload-pages">
            {photos.map((photo, i) => (
              <li
                key={photo.id}
                className={
                  failedPage === i + 1 ? "photo-upload-page photo-upload-page--failed" : "photo-upload-page"
                }
              >
                <img src={photoSrc(photo)} alt={`Page ${i + 1} of the recipe`} />
                <span className="photo-upload-page-label">Page {i + 1}</span>
                <div className="photo-upload-page-controls">
                  <button
                    type="button"
                    onClick={() => movePhoto(i, -1)}
                    disabled={i === 0 || isBusy}
                    aria-label={`Move page ${i + 1} earlier`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(i, 1)}
                    disabled={i === photos.length - 1 || isBusy}
                    aria-label={`Move page ${i + 1} later`}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    disabled={isBusy}
                    aria-label={`Remove page ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {isExtracting && <p>Reading your recipe... this can take a few seconds.</p>}

          {tip ? (
            <div className="photo-upload-failure" role="alert">
              <p className="photo-upload-failure-title">
                {failedPage ? `Page ${failedPage}: ${tip.title}` : tip.title}
              </p>
              <p>{tip.tip}</p>
              <div className="photo-upload-actions">
                <button type="button" onClick={handleSubmit} disabled={isBusy}>
                  {isExtracting ? "Reading..." : "Try again"}
                </button>
                {failedPage ? (
                  <button
                    type="button"
                    className="photo-upload-secondary"
                    onClick={() => openPicker(failedPage - 1)}
                    disabled={isBusy}
                  >
                    Replace page {failedPage}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="photo-upload-secondary"
                    onClick={removeAll}
                    disabled={isBusy}
                  >
                    Start over
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="photo-upload-actions">
              <button type="button" onClick={handleSubmit} disabled={isBusy}>
                {isExtracting ? "Reading..." : `Submit ${plural}`}
              </button>
              {roomLeft > 0 && (
                <button
                  type="button"
                  className="photo-upload-secondary"
                  onClick={() => openPicker()}
                  disabled={isBusy}
                >
                  Add another photo
                </button>
              )}
              <button
                type="button"
                className="photo-upload-secondary"
                onClick={removeAll}
                disabled={isBusy}
              >
                Remove all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
