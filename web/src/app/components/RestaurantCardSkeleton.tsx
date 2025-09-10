import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

// Skeleton for loading state
export default function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <Skeleton data-testid="skeleton" className="w-full h-48" />
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="w-3/4">
            <Skeleton data-testid="skeleton" className="h-6 w-3/4 mb-2" />
            <Skeleton data-testid="skeleton" className="h-4 w-1/2 mb-3" />
          </div>
          <Skeleton data-testid="skeleton" className="h-8 w-10 rounded-md" />
        </div>
        <Skeleton data-testid="skeleton" className="h-4 w-full mb-2" />
        <Skeleton data-testid="skeleton" className="h-4 w-5/6 mb-4" />
        <div className="flex gap-2">
          <Skeleton data-testid="skeleton" className="h-6 w-16 rounded-full" />
          <Skeleton data-testid="skeleton" className="h-6 w-16 rounded-full" />
          <Skeleton data-testid="skeleton" className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Skeleton data-testid="skeleton" className="h-8 w-24" />
        <Skeleton data-testid="skeleton" className="h-8 w-24" />
      </CardFooter>
    </Card>
  )
}