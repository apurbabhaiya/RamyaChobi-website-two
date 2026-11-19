import React, { useEffect, useState } from "react";
import RamyaChobiHome from "./RamyaChobiHome";

export default function RamyaChobiEntry() {
  const [canEnter] = useState(() => {
    const introDone = new URLSearchParams(window.location.search).get("intro") === "done";
    try {
      return introDone || window.sessionStorage.getItem("ramyachobi_intro_seen") === "1";
    } catch {
      return introDone;
    }
  });

  useEffect(() => {
    if (!canEnter) {
      window.location.replace("/ramyachobi-intro.html");
      return;
    }

    if (new URLSearchParams(window.location.search).get("intro") === "done") {
      try {
        window.sessionStorage.setItem("ramyachobi_intro_seen", "1");
      } catch {
        // The intro query parameter still permits this visit if storage is unavailable.
      }
      window.history.replaceState({}, document.title, "/");
    }
  }, [canEnter]);

  return canEnter ? <RamyaChobiHome /> : null;
}
