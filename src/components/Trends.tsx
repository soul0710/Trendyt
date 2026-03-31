import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Select } from "./ui/select"
import { Input } from "./ui/input"
import { Loader2, TrendingUp, Youtube, Video } from "lucide-react"
import { GoogleGenAI } from "@google/genai"
import { KeywordTrendChart } from "./KeywordTrendChart"

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "global", label: "Worldwide" },
]

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "google", label: "Google Search" },
]

const CATEGORIES = [
  { value: "gaming", label: "Gaming" },
  { value: "music", label: "Music" },
  { value: "entertainment", label: "Entertainment" },
  { value: "education", label: "Education" },
  { value: "tech", label: "Science & Technology" },
  { value: "sports", label: "Sports" },
  { value: "news", label: "News & Politics" },
  { value: "comedy", label: "Comedy" },
  { value: "howto", label: "Howto & Style" },
  { value: "travel", label: "Travel & Events" },
]

interface Channel {
  name: string
  url: string
}

interface Video {
  title: string
  url: string
}

interface TrendItem {
  keyword: string
  trendScore: number
  description: string
  channels: Channel[]
  videos: Video[]
}

export function Trends() {
  const [region, setRegion] = useState("US")
  const [platform, setPlatform] = useState("youtube")
  const [category, setCategory] = useState("gaming")
  const [keywordFilter, setKeywordFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGetTrends = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      
      const regionLabel = REGIONS.find(r => r.value === region)?.label || region
      const platformLabel = PLATFORMS.find(p => p.value === platform)?.label || platform
      const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category

      let prompt = `What are the current top 20 trending keywords or topics for the "${categoryLabel}" category on ${platformLabel} in ${regionLabel}?`
      
      if (keywordFilter.trim()) {
        prompt += ` Specifically, focus on trends related to or containing the keyword: "${keywordFilter.trim()}".`
      }

      prompt += `
      Provide a trend score from 1-100 for each, and a brief 1-sentence description of why it's trending.
      Also provide 5 trending YouTube channels and 5 trending YouTube videos related to each keyword.
      
      CRITICAL: To prevent timeouts, DO NOT use the search tool to find exact YouTube video IDs or channel IDs. 
      Instead, you MUST construct YouTube search URLs for the channels and videos like this:
      - Channel URL: https://www.youtube.com/results?search_query=[URL-encoded channel name]
      - Video URL: https://www.youtube.com/results?search_query=[URL-encoded video title]
      
      You MUST return ONLY a valid JSON array of objects, with no additional markdown formatting or text outside the array.
      Each object must have these exact keys:
      - "keyword" (string)
      - "trendScore" (number)
      - "description" (string)
      - "channels" (array of objects with "name" and "url" strings, 5 channels)
      - "videos" (array of objects with "title" and "url" strings, 5 videos)`

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })

      if (response.text) {
        // Extract JSON array from markdown if present
        const jsonMatch = response.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsedTrends = JSON.parse(jsonMatch[0])
          setTrends(parsedTrends.sort((a: TrendItem, b: TrendItem) => b.trendScore - a.trendScore))
        } else {
          throw new Error("Failed to parse trends data")
        }
      } else {
        throw new Error("No data returned from AI")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch trends")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Trends Explorer</CardTitle>
          <CardDescription>
            Discover popular keywords and trending topics by category, platform, and region.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end flex-wrap">
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium text-zinc-700">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium text-zinc-700">Platform</label>
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium text-zinc-700">Region</label>
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-sm font-medium text-zinc-700">Keyword (Optional)</label>
              <Input 
                placeholder="Filter by keyword..." 
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetTrends()}
              />
            </div>
            <Button onClick={handleGetTrends} disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
              Find Trends
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {trends.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {trends.map((trend, index) => (
            <Card key={index} className="overflow-hidden transition-all hover:shadow-md flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                    {index + 1}
                  </span>
                  <h4 className="font-semibold text-zinc-900 line-clamp-1" title={trend.keyword}>
                    {trend.keyword}
                  </h4>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  {trend.trendScore}
                </div>
              </div>
              <CardContent className="flex-1 p-6 space-y-6">
                <div>
                  <p className="text-sm text-zinc-600">{trend.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">30-Day Trend</h5>
                  <KeywordTrendChart keyword={trend.keyword} region={region} platform={platform} index={index} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <Youtube className="h-3.5 w-3.5 text-red-500" />
                      Top Channels
                    </h5>
                    <ul className="space-y-1.5">
                      {trend.channels?.map((channel, idx) => (
                        <li key={idx} className="text-xs text-zinc-700 line-clamp-1" title={channel.name}>
                          • <a href={channel.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">{channel.name}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <Video className="h-3.5 w-3.5 text-blue-500" />
                      Top Videos
                    </h5>
                    <ul className="space-y-1.5">
                      {trend.videos?.map((video, idx) => (
                        <li key={idx} className="text-xs text-zinc-700 line-clamp-1" title={video.title}>
                          • <a href={video.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">{video.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
