import React from "react";
import ParentChildModule from "./ParentChild";

const ParentModule = () => {
  return (
    <div>
      <div>This is the parent component</div>
      <hr />
      <ParentChildModule />
    </div>
  );
};

export default ParentModule;
