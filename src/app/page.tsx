"use client";

import React, { useState } from "react";

export default function Page() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [jobValid, setJobValid] = useState<boolean | null>(null);
  const [fileValid, setFileValid] = useState<boolean | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setFileValid(true);
    } else {
      setSelectedFile(null);
      setFileValid(false);
    }
  }

  function handleSubmitJobDescription() {
    if (jobDescription.trim() !== "") {
      setJobValid(true);
    } else {
      setJobValid(false);
    }
  }

  function startInterview() {
    if (!selectedFile) setFileValid(false);
    if (!jobDescription.trim()) setJobValid(false);

    // Only allow interview if file is selected AND job description has been submitted successfully
    if (selectedFile && jobValid) {
      setInterviewStarted(true);
    }
  }

  const fileLabelClass =
    interviewStarted
      ? "font-road font-bold border border-gray-50 px-4 py-2 rounded text-gray-500 cursor-default text-center w-[250px]"
      : fileValid === null
      ? "font-road font-bold border border-gray-50 px-4 py-2 rounded cursor-pointer text-center hover:bg-gray-700 w-[250px]"
      : fileValid
      ? "font-road font-bold border border-green-500 px-4 py-2 rounded text-green-500 cursor-pointer text-center w-[250px]"
      : "font-road font-bold border border-red-500 px-4 py-2 rounded text-red-500 cursor-pointer text-center w-[250px]";

  const jobInputClass =
    interviewStarted
      ? "border border-gray-50 px-4 py-10 w-[250px] rounded text-gray-500 cursor-default"
      : jobValid === null
      ? "border border-gray-50 px-4 py-10 w-[250px] rounded focus:outline-none focus:ring-2 focus:ring-white"
      : jobValid
      ? "border border-green-500 px-4 py-10 w-[250px] rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      : "border border-red-500 px-4 py-10 w-[250px] rounded focus:outline-none focus:ring-2 focus:ring-red-500";

  const submitButtonClass =
    jobValid === null
      ? "font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]"
      : jobValid
      ? "font-road font-bold border border-green-500 px-4 py-2 rounded text-green-500 cursor-pointer w-[250px]"
      : "font-road font-bold border border-red-500 px-4 py-2 rounded text-red-500 cursor-pointer w-[250px]";

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">

      <header className="text-4xl font-road">
        Welcome to AI Interviewer
      </header>

      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">

            {/* Choose File */}
            <form className="flex flex-col gap-1">
              {interviewStarted && (
                <span className="font-road font-bold text-gray-500 ml-1 mt-0.5 text-sm">Selected File</span>
              )}
              <div className="flex items-center gap-2">
                {!interviewStarted && <span className="w-6 font-bold text-left">1.</span>}
                <label className={fileLabelClass}>
                  {selectedFile
                    ? selectedFile.name
                    : interviewStarted
                    ? "No file selected"
                    : "Choose File"}
                  {!interviewStarted && (
                    <input
                      type="file"
                      className="hidden"
                      name="resume"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      required
                    />
                  )}
                </label>
              </div>
            </form>

            {/* Paste Job Description */}
            {interviewStarted && (
              <span className="font-road font-bold text-gray-500 ml-1 mt-0.5 text-sm">Job Description</span>
            )}
            <div className="flex items-center gap-2">
              {!interviewStarted && <span className="w-6 font-bold text-left">2.</span>}
              <input
                type="text"
                placeholder="Paste Job Description Here"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className={jobInputClass}
                readOnly={interviewStarted}
              />
            </div>

            {/* Submit Job Description & Start Interview */}
            {!interviewStarted && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-6 font-bold text-left">3.</span>
                  <button
                    className={submitButtonClass}
                    onClick={handleSubmitJobDescription}
                  >
                    Submit Job Description
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-6 font-bold text-left">4.</span>
                  <button
                    className="font-road font-bold border border-gray-50 px-4 py-2 rounded hover:bg-gray-700 cursor-pointer w-[250px]"
                    onClick={startInterview}
                  >
                    Start Interview
                  </button>
                </div>
              </>
            )}

          </div>

          {/* "follow these steps" -> "Interview Started" */}
          <div className="text-green-500 font-road font-bold border border-white w-250 h-130 p-4 mx-auto relative">
            <div
              className={`inline-flex font-road font-bold w-fit h-fit p-2 whitespace-nowrap rounded border ${
                interviewStarted ? "text-yellow-500 border-yellow-500" : "text-green-500 border-green-500"
              }`}
            >
              {interviewStarted
                ? "Interview Started"
                : "⬅ To get started, follow these simple steps!"}
            </div>
          </div>

        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}