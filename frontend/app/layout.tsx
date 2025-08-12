import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReviewProvider } from '@/contexts/ReviewContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '従業員数レビューシステム',
  description: '企業の従業員数抽出結果をレビュー・確認するためのシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ReviewProvider>
          {children}
        </ReviewProvider>
      </body>
    </html>
  )
}