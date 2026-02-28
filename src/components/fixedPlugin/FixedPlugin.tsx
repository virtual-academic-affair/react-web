// Chakra Imports
// Custom Icons
import React from "react";

import { RiMoonFill, RiSunFill } from "react-icons/ri";
export default function FixedPlugin(props: { [s: string]: any }) {
  const { ...rest } = props;
  const [darkmode, setDarkmode] = React.useState(
    document.body.classList.contains("dark"),
  );

  return (
    <button
      className="border-px from-brandLinear to-blueSecondary fixed right-8.75 bottom-7.5 z-99! flex h-15 w-15 items-center justify-center rounded-full border-[#6a53ff] bg-linear-to-br p-0"
      onClick={() => {
        if (darkmode) {
          document.body.classList.remove("dark");
          setDarkmode(false);
        } else {
          document.body.classList.add("dark");
          setDarkmode(true);
        }
      }}
      {...rest}
    >
      {/* // left={document.documentElement.dir === "rtl" ? "35px" : ""}
      // right={document.documentElement.dir === "rtl" ? "" : "35px"} */}
      <div className="cursor-pointer text-gray-600">
        {darkmode ? (
          <RiSunFill className="h-4 w-4 text-white" />
        ) : (
          <RiMoonFill className="h-4 w-4 text-white" />
        )}
      </div>
    </button>
  );
}
