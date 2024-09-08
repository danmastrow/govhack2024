import Editor from "./components/editor";

export default function Home() {
  return (
    <div className="">
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">
              Australian Style Guide - AI Linter
            </h1>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow container mx-auto my-8 p-4 max-w-xl">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Try it out now!</h2>
            <Editor />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-200 p-4">
          <div className="container mx-auto text-center text-gray-600">
            Made by Dan Mastrowicz for{" "}
            <a
              href="https://hackerspace.govhack.org/events"
              className="text-blue-600 underline"
            >
              GovHack 2024
            </a>
            <p>
              <a
                href="https://github.com/danmastrow/govhack2024"
                className="text-blue-600 underline"
              >
                Github Repo
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
