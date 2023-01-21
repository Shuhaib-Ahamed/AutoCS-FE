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
          <div className="bg-transparent sm:text-sm text-zinc-100">
            <div className="rounded-lg  p-3.5 lg:p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
