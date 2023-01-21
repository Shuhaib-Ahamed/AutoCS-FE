import { GlobalNav } from "app/ui/GlobalNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-1100 bg-[url('/grid.svg')] ">
      <GlobalNav />
      <div className="lg:pl-72">
        <div className="my-8 mx-auto max-w-4xl space-y-8 px-2 pt-20 lg:py-8 lg:px-8">
          <h1 className="py-4 text-5xl font-bold text-center text-transparent bg-gradient-to-t bg-clip-text from-zinc-100/60 to-white">
            Explore API Endpoints
          </h1>
          <div className="bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
            <div className="rounded-lg  p-3.5 lg:p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
