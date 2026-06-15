export interface PackData {
  id?: string
  title: string
  description?: string
  ownerId: string
  ownerName: string
  levelIds: string[]
  icons: string[]       // 1-4 emoji
  color: string         // card background color
  published: boolean
  featured: boolean
  featuredOrder?: number
  upvotes: number
  createdAt?: unknown
  updatedAt?: unknown
}
