"use client";
import React, { ReactNode } from "react";
import Header from "@/components/Header";
const Layout = ({ children }: { children: ReactNode }) => {

  return (
    <main className="root-container min-h-screen flex flex-col relative">
      <div
        className={`mx-auto flex-1 w-full h-full `}
      >
        <Header />
        {children}
      </div>
    </main>
  );
};

export default Layout;
