"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ROUTES } from "@/lib/constants"
import { User, Edit, Camera, LogOut } from "lucide-react"
import postsAPI from "@/services/posts"
import { PostCard } from "@/components/posts/PostCard"
import { Button } from "@/components/ui/button"

interface UserProfile {
  name: string
  email: string
  profileImage?: string
}

interface Post {
  _id: string
  title: string
  content: string
  images?: string[]
  createdAt: string
  user: {
    _id: string
    name: string
    profileImage?: string
  }
  likes: number
  comments: number
  location?: string
  tags?: string[]
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated, logout, updateUserProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "" })
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)

  // Set initial profile data from auth user
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email,
        profileImage: user.profileImage
      })
    }
  }, [user])

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return

      try {
        const { data } = await postsAPI.getPosts({ user: user._id })
        if (data.success) {
          setUserPosts(data.data)
        }
      } catch (err) {
        console.error("Error fetching user posts:", err)
      } finally {
        setIsLoadingPosts(false)
      }
    }

    if (user) {
      fetchUserPosts()
    }
  }, [user])

  // Check if user is authenticated
  if (!authLoading && !isAuthenticated) {
    router.push(ROUTES.LOGIN)
    return null
  }

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile.name.trim()) {
      setError("Name is required")
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const success = await updateUserProfile(profile.name)
      if (success) {
        setIsEditingProfile(false)
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An error occurred while updating profile")
    } finally {
      setIsUpdating(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg shadow-md p-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        {/* Profile header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <button
            className="text-destructive hover:text-destructive/80 flex items-center"
            onClick={logout}
          >
            <LogOut size={18} className="mr-1" />
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Profile info */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Profile image */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center text-muted-foreground overflow-hidden relative">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.name || "User"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <User size={64} />
              )}
            </div>
            <button
              className="mt-2 text-sm text-primary hover:text-primary/80"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="flex items-center">
                <Camera size={16} className="mr-1" />
                Change Photo
              </span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
              />
            </button>
          </div>

          {/* Profile details */}
          <div className="w-full md:w-2/3">
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                    disabled={isUpdating}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating || !profile.name.trim()}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <button
                    className="text-primary hover:text-primary/80 flex items-center"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p className="mt-1">{profile.name || "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="mt-1">{profile.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User posts */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Posts</h2>

        {isLoadingPosts ? (
          <p className="text-center text-muted-foreground">Loading posts...</p>
        ) : (
          <>
            {userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    id={post._id}
                    username={post.user?.name || "User"}
                    userAvatar={post.user?.profileImage}
                    content={post.content}
                    date={post.createdAt}
                    images={post.images}
                    location={post.location}
                    tags={post.tags}
                    likes={post.likes}
                    comments={post.comments}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-accent rounded-lg">
                <p className="text-muted-foreground mb-4">You haven&apos;t created any posts yet</p>
                <Button asChild>
                  <a href={ROUTES.POST_CREATE}>
                    Create Your First Post
                  </a>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}