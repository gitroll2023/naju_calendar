import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나주지역 일정공유 캘린더",
  description: "나주지역 성도들을 위한 교회 일정공유 모바일 캘린더 서비스",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  keywords: ["나주지역", "교회일정", "일정공유", "캘린더", "예배", "교회행사", "모바일"],
  authors: [{ name: "나주지역" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Calendar Naju" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
