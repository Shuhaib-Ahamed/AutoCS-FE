"use client";
import { useState, useRef } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Title } from "@components/title";
import { ErrorMessage } from "@components/error";
import { login } from "web3/auth";

import { Server } from "stellar-sdk";

const SERVER = new Server("https://horizon-testnet.stellar.org");

export default function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState<Boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [response, setResponse] = useState<any | null>();

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const onSubmit = async (event: any) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      setError("");
      setLoading(true);

      const res = await login(SERVER, data.get("publicKey")?.toString() ?? "");
      setResponse(res);
      if (res) {
        formRef.current!.reset();
      }
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-8 mx-auto ">
      {error ? <ErrorMessage message={error} /> : null}

      <form ref={formRef} className="max-w-3xl mx-auto" onSubmit={onSubmit}>
        <Title>Log on to AutoCS</Title>
        <div className="px-3 py-2 mt-8 border rounded border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0">
          <label
            htmlFor="publicKey"
            className="block text-xs font-medium text-zinc-100"
          >
            PUBLIC KEY
          </label>
          <input
            type="text"
            name="publicKey"
            required
            id="publicKey"
            className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-6 w-full h-12 inline-flex justify-center items-center  transition-all  rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7    bg-zinc-200 ring-1 ring-transparent duration-150   ${"text-zinc-900 hover:text-zinc-100 hover:ring-zinc-600/80  hover:bg-zinc-900/20"} ${
            loading ? "animate-pulse" : ""
          }`}
        >
          <span>
            {loading ? (
              <Cog6ToothIcon className="w-5 h-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </span>
        </button>

        {response && (
          <div className="mt-8">
            <div className="not-prose my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10">
              <div className="flex min-h-[calc(theme(spacing.12)+1px)] flex-wrap items-start gap-x-4 border-b border-zinc-700 bg-zinc-800 px-4 dark:border-zinc-800 dark:bg-transparent">
                <h3 className="mr-auto pt-3 text-sm font-semibold text-white">
                  Payload
                </h3>
              </div>
              <pre className="group dark:bg-white/2.5">
                <div className="relative">
                  <pre // We expect the server and client initial state to be different
                    // because `document` doesn't exist on the server.
                    suppressHydrationWarning
                    className="overflow-y-auto p-4 text-xs text-green-500"
                  >
                    {JSON.stringify(response, null, 2)}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyClick}
                    className="group/button absolute top-3.5 right-4 overflow-hidden rounded-full py-1 pl-2 pr-3 text-2xs font-medium opacity-0 backdrop-blur transition focus:opacity-100 group-hover:opacity-100 bg-white/5 hover:bg-white/7.5 dark:bg-white/2.5 dark:hover:bg-white/5"
                  >
                    {!copied ? (
                      <span className="pointer-events-none flex items-center gap-0.5 text-zinc-400">
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="h-5 w-5 fill-zinc-500/20 stroke-zinc-500 transition-colors group-hover/button:stroke-zinc-400"
                        >
                          <path
                            stroke-width="0"
                            d="M5.5 13.5v-5a2 2 0 0 1 2-2l.447-.894A2 2 0 0 1 9.737 4.5h.527a2 2 0 0 1 1.789 1.106l.447.894a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2Z"
                          ></path>
                          <path
                            fill="none"
                            stroke-linejoin="round"
                            d="M12.5 6.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2m5 0-.447-.894a2 2 0 0 0-1.79-1.106h-.527a2 2 0 0 0-1.789 1.106L7.5 6.5m5 0-1 1h-3l-1-1"
                          ></path>
                        </svg>
                        Copy
                      </span>
                    ) : (
                      <span className="pointer-events-none flex items-center justify-center text-emerald-400 ">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8">
          <ul className="space-y-2 text-xs text-zinc-500">
            <li>
              <p>
                <span className="font-semibold text-zinc-400">Reads:</span> The
                number of reads determines how often the data can be shared,
                before it deletes itself. 0 means unlimited.
              </p>
            </li>
            <li>
              <p>
                <span className="font-semibold text-zinc-400">TTL:</span> You
                can add a TTL (time to live) to the data, to automatically
                delete it after a certain amount of time. 0 means no TTL.
              </p>
            </li>
            <p>
              Clicking Share will generate a new symmetrical key and encrypt
              your data before sending only the encrypted data to the server.
            </p>
          </ul>
        </div>
      </form>
    </div>
  );
}
