// src/components/PostsList.tsx
import React from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Image as ImageIcon,
  Smile,
  Send
} from 'lucide-react';
import { Button } from './ui/button';

interface Post {
  id: number;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      role: 'Product Designer'
    },
    content: "Just finished the new design system for our admin dashboard! Really excited about the glassmorphism effects we've implemented. What do you guys think? ✨",
    likes: 124,
    comments: 12,
    time: '2 hours ago'
  },
  {
    id: 2,
    author: {
      name: 'Alex Rivera',
      avatar: 'AR',
      role: 'Senior Developer'
    },
    content: "Deep dive into React Server Components today. The performance gains are real! If you haven't checked them out yet, you're missing out. 🚀",
    likes: 89,
    comments: 5,
    time: '5 hours ago'
  },
  {
    id: 3,
    author: {
      name: 'Elena Gilbert',
      avatar: 'EG',
      role: 'Tech Lead'
    },
    content: "Our team just reached 10k users! Huge milestone for the project. Thanks to everyone for the hard work! 🎉",
    likes: 456,
    comments: 28,
    time: '1 day ago'
  }
];

const PostsList: React.FC = () => {
  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dynamic Feed</h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest community activities.</p>
        </div>
        <Button className="bg-slate-900">Create Post</Button>
      </div>

      {/* Post Input Box */}
      <div className="bg-white rounded-xl border p-4 mb-8 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold uppercase">SN</div>
          <div className="flex-1">
            <textarea 
              placeholder="What's on your mind?" 
              className="w-full h-24 p-3 rounded-lg bg-slate-50/50 border-none focus:ring-1 focus:ring-slate-200 resize-none text-sm outline-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-muted-foreground transition-colors">
                  <ImageIcon size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-muted-foreground transition-colors">
                  <Smile size={18} />
                </button>
              </div>
              <Button size="sm" className="gap-2">
                Post <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {mockPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border shadow-sm overflow-hidden group hover:border-slate-300 transition-all">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                    {post.author.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-none">{post.author.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1">{post.author.role} • {post.time}</p>
                  </div>
                </div>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-muted-foreground transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <div className="text-sm text-slate-700 leading-relaxed mb-4">
                {post.content}
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-slate-900 transition-colors group/btn">
                  <div className="p-1.5 group-hover/btn:bg-red-50 rounded-full transition-colors">
                    <Heart size={16} className="group-hover/btn:text-red-500" />
                  </div>
                  {post.likes} Likes
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-slate-900 transition-colors group/btn">
                  <div className="p-1.5 group-hover/btn:bg-blue-50 rounded-full transition-colors">
                    <MessageCircle size={16} className="group-hover/btn:text-blue-500" />
                  </div>
                  {post.comments} Comments
                </button>
                <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-slate-900 transition-colors group/btn">
                  <div className="p-1.5 group-hover/btn:bg-slate-50 rounded-full transition-colors">
                    <Share2 size={16} className="group-hover/btn:text-slate-900" />
                  </div>
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostsList;