import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import KakaoInit from '@/components/KakaoInit'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "내 AI 타입 찾기",
  description: "내 성향엔 어떤 AI가 맞을까? 2분 안에 내 타입을 찾고 맞춤 프롬프트까지 받아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <KakaoInit />
      </body>
    </html>
  );
}
