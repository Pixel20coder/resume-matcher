import { ImageResponse } from "next/og";

export const alt = "ResumeMatch — AI resume vs. job-description analyzer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #312e81 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            color: "#a5b4fc",
            fontWeight: 600,
          }}
        >
          ResumeMatch
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Match your resume to any job in seconds.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 34,
            color: "#d4d4d8",
          }}
        >
          AI match score · skills gap · tailored bullets
        </div>
      </div>
    ),
    size,
  );
}
