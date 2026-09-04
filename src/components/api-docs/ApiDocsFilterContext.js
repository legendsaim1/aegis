"use client";

import { createContext, useContext, useState } from "react";

const ApiDocsFilterContext = createContext({
  activeMethod: "ALL",
  setActiveMethod: () => {},
  searchQuery: "",
  setSearchQuery: () => {}
});

export function ApiDocsFilterProvider({ children }) {
  const [activeMethod, setActiveMethod] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ApiDocsFilterContext.Provider
      value={{
        activeMethod,
        setActiveMethod,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </ApiDocsFilterContext.Provider>
  );
}

export function useApiDocsFilter() {
  return useContext(ApiDocsFilterContext);
}
