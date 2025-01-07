import Editor from "./components/editor";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Demo Video Section */}
        <section>
          <div className="relative pb-[65%] h-0">
            <iframe
              src="https://www.loom.com/embed/313bbee9577341e8925c585b54a462ca?sid=50d0c0c9-cc9f-4279-b967-6b22e465b3f2"
              frameBorder="0"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
          <p className="text-muted-foreground mt-4">
            ℹ️ This previously interactive prototype has been disabled to
            prevent misuse. Please check the{" "}
            <a
              href="https://github.com/yourusername/style-guide-linter"
              className="underline hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>{" "}
            for more information.
          </p>
        </section>

        {/* Editor Section */}
        <Editor />
      </div>
    </main>
  );
}
