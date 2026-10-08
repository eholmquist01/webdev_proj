import React from "react";
import ParentModule from "./Parent";

const ContainerModule = () => {
  return (
    <div>
      This is the container component
      <hr />
      <ParentModule />
    </div>
  );
};

export default ContainerModule;
