import React, { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface KeywordTrendChartProps {
  keyword: string
  region: string
  platform: string
  index?: number
}

export function KeywordTrendChart({ keyword, region, platform, index = 0 }: KeywordTrendChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchTrend = async () => {
      // Add a staggered delay based on index to prevent Google Trends API rate limiting
      // when fetching multiple charts at once.
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 1500))
      }
      
      if (!isMounted) return;

      setLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams({
          keywords: keyword,
          geo: region,
          property: platform === "youtube" ? "youtube" : "web",
          days: "30", // Last 30 days
        })

        const response = await fetch(`/api/trends/interest?${queryParams}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch data")
        }

        if (isMounted && result.default && result.default.timelineData) {
          const formattedData = result.default.timelineData.map((item: any) => ({
            date: format(new Date(item.time * 1000), "MMM dd"),
            value: item.value[0],
          }))
          setData(formattedData)
        } else if (isMounted) {
          setData([])
          setError("No data")
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTrend()

    return () => {
      isMounted = false
    }
  }, [keyword, region, platform])

  if (loading) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="flex h-[120px] w-full items-center justify-center text-xs text-zinc-400">
        {error || "No trend data available"}
      </div>
    )
  }

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            labelStyle={{ color: '#71717a', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
