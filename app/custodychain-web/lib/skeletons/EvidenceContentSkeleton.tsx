// layout of each [id]/page is :
// 1. title (can be archived or evidence details) - required only
// 2. evidence summary - id, desc, creator, current owner
// 3. chain of custody - 2 views : timeline and graph. requires CustodyRecord[],
// 4. Management area - 2 children : forms
export default function EvidenceContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Evidence Details */}
      <div className="space-y-5">
        <p className="font-sans font-[500] text-4xl text-orange-700">
          Loading Evidence...
        </p>
        <div className="p-4 rounded-sm font-mono font-semibold text-lg text-green-800 bg-green-50 border-2 border-green-700">
          <p>
            ID: <span className="text-orange-700"></span>
          </p>
          <p>
            Description: <span className="text-orange-700"></span>
          </p>
          <p>
            Creator: <span className="text-orange-700"></span>
          </p>
          <p>
            Current Owner:<span className="text-orange-700"></span>
          </p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <p className="font-sans font-[500] text-3xl text-orange-700">
            Chain of Custody:
          </p>
          <nav
            className="grid grid-cols-[1fr_1fr] rounded-t-sm border-2 border-orange-700 font-mono"
            aria-label="Tabs"
          >
            <button
              type="button"
              className="py-2 px-3 bg-orange-50 font-[500] text-orange-900"
            >
              LIST VIEW
            </button>
            <button
              type="button"
              className="py-2 px-3 bg-orange-500 font-[600] text-white"
            >
              TIMELINE VIEW
            </button>
          </nav>
          <div className="max-h-140 overflow-y-scroll p-4 bg-green-50 rounded-b-sm border-2 border-green-700">
            <div className="flex flex-col items-center">
              <div className="relative p-2 font-mono font-semibold rounded-sm border-2 border-orange-700 bg-orange-50 shadow-sm">
                <h3 className="text-green-800">Creator</h3>
                <div className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 border-2 border-green-700 rounded-tr-md font-mono text-sm text-green-800">
                  1
                </div>
                <time className="text-orange-900 block leading-none">
                  1/1/2026, 12:00:00 AM
                </time>
                <p className="text-orange-900 break-all">
                  0x0000000000000000000000000000000000000000
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Management */}
        <div className="space-y-4"></div>
      </div>
    </div>
  );
}
