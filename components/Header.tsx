import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-surface-border bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5 sm:px-6">
        <Image
          src="/shadowfax-logo.png"
          alt="Shadowfax"
          width={148}
          height={50}
          priority
          className="h-9 w-auto sm:h-10"
        />
        <div className="h-8 w-px bg-surface-border hidden sm:block" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Tech Escalations Amazon
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Amazon Rider Tech Escalation Management
          </p>
        </div>
      </div>
    </header>
  );
}
