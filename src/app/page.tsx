"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function Page(){
  const [recievedResume, setRecievedResume] = useState<boolean>(false);

  

  async function uploadSubmit(e: React.FormEvent<HTMLFormElement>) {
  setRecievedResume(true);
}



 async function startInterview(e: React.MouseEvent<HTMLButtonElement>) {


  }
  return(
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">

      <header className="text-4xl font-road">
      Welcome to AI Interviewer
      </header>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex gap-3">
          <div className="flex flex-col justify-between h-[250px]">
            
            <div className="flex items-center gap-2">
              <form>
                <div className="w-64 flex flex-col space y-4">
                <span className="w-6 font-bold text-left"> 1.</span>
                  <input
                  type = "file"
                  className="font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]"
                  name= "resume"
                  accept = "application/pdf"
                  required>
                  </input>
                <button className="font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]"
                type="submit">
                  Upload Resume
                </button>
                </div>
              </form>
              
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 font-bold text-left">2.</span>
              <input type="text" placeholder="Paste Job Description Here" className="border border-gray-50 px-4 py-10 w-[250px] rounded focus:outline-none focus:ring-2 focus:ring-white"/>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 font-bold text-left">3.</span>
                <button className="font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]">
                  Submit Job Description
                </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 font-bold text-left">4.</span>
                <button className="font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]">
                  Start Interview
                </button>
            </div>

          </div>
          <div className="border border-white w-250 h-130 mx-auto flex items-center justify-center"></div>
        </div>
        
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
  }




