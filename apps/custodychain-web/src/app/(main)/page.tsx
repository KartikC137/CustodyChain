export default function Home() {
  return (
    <>
      <p className="absolute w-100 top-70 left-25 font-sans font-[600] text-4xl text-orange-700">
        manage and verify integrity of all your evidences in one place
      </p>

      {/* red */}
      <div className="absolute z-102 ml-40 top-12">
        <svg
          width="2070"
          height="1271"
          viewBox="0 0 2070 1271"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <foreignObject
            x="19.6348"
            y="-16.863"
            width="2030.73"
            height="1306.73"
          >
            <div
              style={{
                backdropFilter: "blur(12px)",
                clipPath: "url(#bgblur_0_63_113_clip_path)",
                height: "100%",
                width: "100%",
              }}
            ></div>
          </foreignObject>
          <path
            d="M1006.43 16.6494C1023.16 6.3665 1044.27 6.36655 1061.05 16.6494L1999.58 592.012C2032.81 612.385 2032.91 660.615 1999.76 680.988L1063.57 1256.35C1046.84 1266.63 1025.73 1266.63 1008.95 1256.35L70.4178 680.988C37.1858 660.615 37.0879 612.385 70.2368 592.012L1006.43 16.6494Z"
            fill="#CA3500"
            fillOpacity="0.8"
            stroke="#FFA702"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.25"
            y2="-1.8"
            transform="matrix(0.852592 0.522577 -0.427299 0.90411 84.0342 583.455)"
            stroke="#FFA702"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.24"
            y2="-1.8"
            transform="matrix(0.852592 -0.522577 0.427299 0.90411 1036.01 1165.83)"
            stroke="#FFA702"
            strokeWidth="3.6"
          />
          <mask
            id="mask0_63_113"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="93"
            y="0"
            width="1891"
            height="1166"
          >
            <path
              d="M1032 0L1840 126L1983 584L1033 1165.5L92.9999 583L1032 0Z"
              fill="#CA3500"
            />
          </mask>
          <g mask="url(#mask0_63_113)">
            <foreignObject x="600" y="180" width="1100" height="720">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "9px",
                  border: "4px solid #FFA702",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <video
                  controls
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "fill" }}
                >
                  <source src="/videos/sample_demo.mp4" type="video/mp4" />
                </video>
              </div>
            </foreignObject>
          </g>
          <defs>
            <clipPath
              id="bgblur_0_63_113_clip_path"
              transform="translate(-19.6348 16.863)"
            >
              <path d="M1006.43 16.6494C1023.16 6.3665 1044.27 6.36655 1061.05 16.6494L1999.58 592.012C2032.81 612.385 2032.91 660.615 1999.76 680.988L1063.57 1256.35C1046.84 1266.63 1025.73 1266.63 1008.95 1256.35L70.4178 680.988C37.1858 660.615 37.0879 612.385 70.2368 592.012L1006.43 16.6494Z" />
            </clipPath>
          </defs>
        </svg>

        {/* <svg
          width="2070"
          height="1271"
          viewBox="0 0 2070 1271"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <foreignObject
            x="19.6348"
            y="-16.863"
            width="2030.73"
            height="1306.73"
          >
            <div
              style={{
                backdropFilter: "blur(12px)",
                clipPath: "url(#bgblur_0_63_113_clip_path)",
                height: "100%",
                width: "100%",
              }}
            ></div>
          </foreignObject>
          <path
            data-figma-bg-blur-radius="24"
            d="M1006.43 16.6494C1023.16 6.36649 1044.27 6.36652 1061.05 16.6494L1999.58 592.012C2032.81 612.385 2032.91 660.615 1999.76 680.988L1063.57 1256.35C1046.84 1266.63 1025.73 1266.63 1008.95 1256.35L70.4178 680.988C37.1858 660.615 37.0879 612.385 70.2368 592.012L1006.43 16.6494Z"
            fill="#CA3500"
            fillOpacity="0.8"
            stroke="#FFA702"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.25"
            y2="-1.8"
            transform="matrix(0.852592 0.522577 -0.427299 0.90411 84.0342 583.455)"
            stroke="#FFA702"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.24"
            y2="-1.8"
            transform="matrix(0.852592 -0.522577 0.427299 0.90411 1036.01 1165.83)"
            stroke="#FFA702"
            strokeWidth="3.6"
          />

          <mask
            id="mask0_63_113"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="93"
            y="0"
            width="1891"
            height="1166"
          >
            <foreignObject
              x="19.6348"
              y="-16.863"
              width="2030.73"
              height="1306.73"
            >
              <div
                style={{
                  clipPath: "url(#bgblur_1_63_113_clip_path)",
                  height: "100%",
                  width: "100%",
                }}
              ></div>
            </foreignObject>
            <path
              d="M1032 0L1983 584L1033 1165.5L92.9999 583L1032 0Z"
              fill="#ffffffff"
            />
          </mask>
          <g mask="url(#mask0_63_113)">
            <foreignObject x="600" y="180" width="1200" height="720">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "9px",
                  border: "6px solid #FFA702",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <video
                  controls
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "fill" }}
                >
                  <source src="/videos/sample_demo.mp4" type="video/mp4" />
                </video>
              </div>
            </foreignObject>
          </g>
          <defs>
            <clipPath
              id="bgblur_0_63_113_clip_path"
              transform="translate(-19.6348 16.863)"
            >
              <path d="M1006.43 16.6494C1023.16 6.36649 1044.27 6.36652 1061.05 16.6494L1999.58 592.012C2032.81 612.385 2032.91 660.615 1999.76 680.988L1063.57 1256.35C1046.84 1266.63 1025.73 1266.63 1008.95 1256.35L70.4178 680.988C37.1858 660.615 37.0879 612.385 70.2368 592.012L1006.43 16.6494Z" />
            </clipPath>
            <clipPath
              id="bgblur_1_63_113_clip_path"
              transform="translate(-19.6348 16.863)"
            >
              <path d="M1032 0L1983 584L1033 1165.5L92.9999 583L1032 0Z" />
            </clipPath>
          </defs>
        </svg> */}
      </div>
      {/* green */}
      <div className="absolute right-90 top-170 z-100">
        <svg
          width="2070"
          height="1269"
          viewBox="0 0 2070 1269"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <foreignObject
            x="19.6348"
            y="-18.863"
            width="2030.73"
            height="1306.73"
          >
            <div
              style={{
                backdropFilter: "blur(12px)",
                clipPath: "url(#bgblur_0_67_119_clip_path)",
                height: "100%",
                width: "100%",
              }}
            ></div>
          </foreignObject>
          <path
            d="M1006.43 14.6494C1023.16 4.36649 1044.27 4.36652 1061.05 14.6494L1999.58 590.012C2032.81 610.385 2032.91 658.615 1999.76 678.988L1063.57 1254.35C1046.84 1264.63 1025.73 1264.63 1008.95 1254.35L70.4178 678.988C37.1858 658.615 37.0879 610.385 70.2368 590.012L1006.43 14.6494Z"
            fill="#10B981"
            fillOpacity="0.8"
            stroke="#085E41"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.25"
            y2="-1.8"
            transform="matrix(0.852592 0.522577 -0.427299 0.90411 84.0342 581.455)"
            stroke="#085E41"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.24"
            y2="-1.8"
            transform="matrix(0.852592 -0.522577 0.427299 0.90411 1036.01 1163.83)"
            stroke="#085E41"
            strokeWidth="3.6"
          />
          <defs>
            <clipPath
              id="bgblur_0_67_119_clip_path"
              transform="translate(-19.6348 18.863)"
            >
              <path d="M1006.43 14.6494C1023.16 4.36649 1044.27 4.36652 1061.05 14.6494L1999.58 590.012C2032.81 610.385 2032.91 658.615 1999.76 678.988L1063.57 1254.35C1046.84 1264.63 1025.73 1264.63 1008.95 1254.35L70.4178 678.988C37.1858 658.615 37.0879 610.385 70.2368 590.012L1006.43 14.6494Z" />
            </clipPath>
          </defs>
        </svg>
      </div>
      {/* yellow */}
      <div className="absolute top-300 left-20 z-101">
        <svg
          width="2070"
          height="1269"
          viewBox="0 0 2070 1269"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <foreignObject
            x="19.6348"
            y="-18.863"
            width="2030.73"
            height="1306.73"
          >
            <div
              style={{
                backdropFilter: "blur(12px)",
                clipPath: "url(#bgblur_0_67_125_clip_path)",
                height: "100%",
                width: "100%",
              }}
            ></div>
          </foreignObject>
          <path
            data-figma-bg-blur-radius="24"
            d="M1006.43 14.6494C1023.16 4.36649 1044.27 4.36652 1061.05 14.6494L1999.58 590.012C2032.81 610.385 2032.91 658.615 1999.76 678.988L1063.57 1254.35C1046.84 1264.63 1025.73 1264.63 1008.95 1254.35L70.4178 678.988C37.1858 658.615 37.0879 610.385 70.2368 590.012L1006.43 14.6494Z"
            fill="#FFA702"
            fillOpacity="0.8"
            stroke="#CA3500"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.25"
            y2="-1.8"
            transform="matrix(0.852592 0.522577 -0.427299 0.90411 84.0342 581.455)"
            stroke="#CA3500"
            strokeWidth="3.6"
          />
          <line
            y1="-1.8"
            x2="1114.24"
            y2="-1.8"
            transform="matrix(0.852592 -0.522577 0.427299 0.90411 1036.01 1163.83)"
            stroke="#CA3500"
            strokeWidth="3.6"
          />
          <defs>
            <clipPath
              id="bgblur_0_67_125_clip_path"
              transform="translate(-19.6348 18.863)"
            >
              <path d="M1006.43 14.6494C1023.16 4.36649 1044.27 4.36652 1061.05 14.6494L1999.58 590.012C2032.81 610.385 2032.91 658.615 1999.76 678.988L1063.57 1254.35C1046.84 1264.63 1025.73 1264.63 1008.95 1254.35L70.4178 678.988C37.1858 658.615 37.0879 610.385 70.2368 590.012L1006.43 14.6494Z" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </>
  );
}
