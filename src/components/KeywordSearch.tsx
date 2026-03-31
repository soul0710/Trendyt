import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Select } from "./ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, Search } from "lucide-react"
import { format } from "date-fns"

const REGIONS = [
  { value: "global", label: "Worldwide" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
]

const PLATFORMS = [
  { value: "web", label: "Google Search" },
  { value: "youtube", label: "YouTube Search" },
  { value: "images", label: "Image Search" },
  { value: "news", label: "News Search" },
]

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#9333ea"]

export function KeywordSearch() {
  const [keywords, setKeywords] = useState("react, vue")
  const [region, setRegion] = useState("global")
  const [platform, setPlatform] = useState("web")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeKeywords, setActiveKeywords] = useState<string[]>([])

  const handleSearch = async () => {
    const keywordList = keywords.split(",").map(k => k.trim()).filter(Boolean)
    
    if (keywordList.length === 0) return

    if (keywordList.length > 5) {
      setError("Google Trends only supports comparing up to 5 keywords at a time.")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams({
        keywords: keywordList.join(","),
        geo: region,
        property: platform,
      })

      const response = await fetch(`/api/trends/interest?${queryParams}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      if (result.default && result.default.timelineData) {
        const formattedData = result.default.timelineData.map((item: any) => {
          const dataPoint: any = {
            date: format(new Date(item.time * 1000), "MMM yyyy"),
            timestamp: item.time,
          }
          
          item.value.forEach((val: number, idx: number) => {
            const keyword = keywordList[idx]
            dataPoint[keyword] = val
          })
          
          return dataPoint
        })
        
        setData(formattedData)
        setActiveKeywords(keywordList)
      } else {
        setData([])
        setError("No data found for these keywords.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Keyword Search Index</CardTitle>
          <CardDescription>
            Compare search interest over the past 12 months. Enter up to 5 keywords separated by commas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-zinc-700">Keywords</label>
              <Input 
                placeholder="e.g. react, vue, angular" 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
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
              <label className="text-sm font-medium text-zinc-700">Platform</label>
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interest Over Time</CardTitle>
            <CardDescription>
              Numbers represent search interest relative to the highest point on the chart for the given region and time. A value of 100 is the peak popularity for the term.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {activeKeywords.map((keyword, index) => (
                    <Line 
                      key={keyword}
                      type="monotone" 
                      dataKey={keyword} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
