import { useState, FormEvent, ChangeEvent } from 'react';
import { usePosts, useCreatePost } from '../hooks/usePosts';
import type { Post, PostRequest } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Posts = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostRequest>({ userId: 1, title: '', body: '' });
  const [filterUserId, setFilterUserId] = useState<number | undefined>(undefined);
  const [filterInput, setFilterInput] = useState('');

  const { data: posts = [], isLoading, error } = usePosts(filterUserId);
  const createMutation = useCreatePost();

  const handleFilter = () => {
    if (filterInput) {
      setFilterUserId(parseInt(filterInput));
    } else {
      setFilterUserId(undefined);
    }
  };

  const clearFilter = () => {
    setFilterInput('');
    setFilterUserId(undefined);
  };

  const openCreateModal = () => {
    setSelectedPost(null);
    setFormData({ userId: 1, title: '', body: '' });
    setShowModal(true);
  };

  const openViewModal = (post: Post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setFormData({ userId: 1, title: '', body: '' });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'userId' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        closeModal();
        alert('Tạo post thành công! (Note: JSONPlaceholder là fake API)');
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-900">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground mt-1">Dữ liệu từ JSONPlaceholder API</p>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Tạo Post
          </Button>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium whitespace-nowrap">Lọc theo User ID:</Label>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="number"
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  className="w-32"
                  placeholder="User ID"
                  min="1"
                />
                <Button onClick={handleFilter} size="sm">
                  Lọc
                </Button>
                {filterUserId && (
                  <Button variant="ghost" size="sm" onClick={clearFilter}>
                    <XIcon className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                )}
              </div>
              {filterUserId && (
                <Badge variant="secondary">
                  Đang lọc: User #{filterUserId}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {(error || createMutation.error) && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{(error as Error)?.message || (createMutation.error as Error)?.message || 'Có lỗi xảy ra'}</span>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner className="h-10 w-10 text-primary" />
            <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileTextIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Chưa có post nào</h3>
              <p className="text-muted-foreground mt-1 mb-4">Bắt đầu bằng việc tạo post mới</p>
              <Button onClick={openCreateModal} className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Tạo Post đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Hiển thị {posts.length} posts
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => openViewModal(post)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        User #{post.userId}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{post.id}</span>
                    </div>
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPost ? <EyeIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                {selectedPost ? 'Chi tiết Post' : 'Tạo Post mới'}
              </DialogTitle>
              <DialogDescription>
                {selectedPost ? 'Xem chi tiết bài viết' : 'Điền thông tin để tạo post mới'}
              </DialogDescription>
            </DialogHeader>

            {selectedPost ? (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  <div className="flex items-center gap-3">
                    <Badge>User #{selectedPost.userId}</Badge>
                    <Badge variant="outline">Post #{selectedPost.id}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedPost.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedPost.body}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      name="userId"
                      type="number"
                      value={formData.userId}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Nhập tiêu đề"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Nội dung</Label>
                    <textarea
                      id="body"
                      name="body"
                      value={formData.body}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Nhập nội dung"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                    {createMutation.isPending ? (
                      <>
                        <LoadingSpinner className="h-4 w-4" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo Post'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default Posts;
