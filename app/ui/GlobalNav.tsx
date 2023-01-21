"use client";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { demos, Item } from "lib/demos";
import clsx from "clsx";

export function GlobalNav() {
  return (
    <div className="fixed top-20 z-10 flex w-full flex-col border-b lg:bottom-0 lg:z-auto lg:w-72 lg:border-r lg:border-zinc-900">
      <div
        className={clsx(
          "overflow-y-auto lg:static lg:block fixed inset-x-0 bottom-0 top-14 mt-px"
        )}
      >
        <nav className="space-y-6 px-2 py-5">
          {demos.map((section) => {
            return (
              <div key={section.name}>
                <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  <div>{section.name}</div>
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <GlobalNavItem key={item.slug} item={item} close={close} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function GlobalNavItem({
  item,
  close,
}: {
  item: Item;
  close: () => false | void;
}) {
  const segment = useSelectedLayoutSegment();
  const isActive = item.slug === segment;

  return (
    <Link
      onClick={close}
      href={`/${item.slug}`}
      className={clsx(
        "block rounded px-3 py-3 text-sm font-medium hover:text-black",
        {
          "text-gray-200 hover:bg-white": !isActive,
          "text-black": isActive,
        }
      )}
    >
      {item.name}
    </Link>
  );
}
