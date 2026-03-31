/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { KeywordSearch } from "./components/KeywordSearch"
import { Trends } from "./components/Trends"
import { BarChart3, TrendingUp } from "lucide-react"

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Trend Explorer</h1>
          <p className="text-zinc-500">
            Analyze search interest and discover trending keywords across platforms.
          </p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Keyword Search
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Category Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-0">
            <KeywordSearch />
          </TabsContent>
          
          <TabsContent value="trends" className="mt-0">
            <Trends />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
