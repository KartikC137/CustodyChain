import { useState } from "react";
import Button from "../../ui/Button";
import Link from "next/link";

//placeholders
const ledgers = [
  "0xf388272266",
  "0xf39fd6e79cfffb92266",
  "0xf39fd6e79cfffb92466",
];

const hasLedgers = ledgers.length > 0;

const pages = ["home", "profile", "ledgers", "about"];
type Pages = "home" | "profile" | "ledgers" | "about";

export default function HomeNavbar() {
  const [page, setPage] = useState<Pages>("home");

  return (
    <nav
      className="grid grid-flow-col w-200 shadow-xl shadow-green-500/20
        bg-green-100 text-green-800 text-center text-2xl font-mono font-[500] rounded-md border-3 border-green-700
        *:px-5 *:py-3 *:border-r-3 *:last:border-none *:border-green-700"
    >
      {pages.map((p) => (
        <Link
          href={`/${p}`}
          key={p}
          onClick={() => setPage(p as Pages)}
          className={`relative flex justify-center items-center group transition-all ease-in duration-200
              ${
                page === p
                  ? "bg-green-700 text-orange-50 font-[600]"
                  : "hover:bg-green-300 hover:font-[600]"
              }
            `}
        >
          <span>{p.toUpperCase()}</span>
          {p === "ledgers" && (
            <>
              <div
                className={`z-101 top-14 w-100 absolute hidden group-hover:flex flex-col px-4
                              bg-green-50 border-x-3 border-b-3 border-t-2 border-green-700 rounded-b-lg
                              text-xl font-[500]`}
              >
                <span className="mt-2 text-start font-mono font-[600]">
                  ----Your Ledgers -------------
                </span>
                {hasLedgers ? (
                  <>
                    {ledgers.map((q) => (
                      <Button
                        onClick={() => {}}
                        className={
                          "peer py-1  border-orange-700 border-b-3 last:border-none text-start text-orange-700 font-mono hover:bg-orange-100 hover:font-[600]"
                        }
                        key={q}
                      >
                        {q}
                      </Button>
                    ))}
                    {ledgers.length === 3 && (
                      <span className="text-start font-mono text-lg mr-4 ">
                        view all ➜
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-mono opacity-80">No Ledgers found</span>
                )}
                <Button className="block my-2 py-3 rounded-xl font-[600] text-2xl text-orange-50 bg-green-700">
                  <span className="bg-green-50 text-green-800 px-2 mr-2 rounded-full">
                    +
                  </span>
                  Create new Ledger
                </Button>
              </div>
              <span className="group-hover:bg-green-700 group-hover:text-white peer-hover:bg-green-500! peer-hover:text-green-50 bg-green-50 px-4 pt-1 ml-4 text-xl/6 rounded-full border-3 border-green-700 text-green-700">
                ⯆
              </span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
