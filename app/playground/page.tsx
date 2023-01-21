import { demos } from "lib/demos";
import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-8 ">
      <h1 className="text-xl font-medium text-gray-300">API Endpoints</h1>
      <div className="space-y-10mx-auto max-w-4xl space-y-8  text-white">
        {demos.map((section) => {
          return (
            <div key={section.name} className="space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.name}
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {section.items.map((item) => {
                  return (
                    <Link
                      href={`/${item.slug}`}
                      key={item.name}
                      className="group block space-y-1.5 bg-transparent border rounded border-zinc-600 px-5 py-3 hover:bg-white"
                    >
                      <div className="font-medium text-gray-200 group-hover:text-black">
                        {item.name}
                      </div>

                      {item.description ? (
                        <div className="line-clamp-3 text-sm  text-zinc-600 group-hover:text-gray-800">
                          {item.description}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
