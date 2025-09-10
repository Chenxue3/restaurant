"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"


export default function RestaurantSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="mb-8">
        <Skeleton className="h-10 w-full mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <Skeleton className="h-32 w-32 rounded-md mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="w-full md:w-2/3">
                <div className="grid gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}