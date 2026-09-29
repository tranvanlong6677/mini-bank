import { useState, useEffect } from 'react';
import { todoApi, todoTemplateApi } from '../services/api';
import { Todo, TodoRequest, Priority, TodoTemplate, TodoTemplateRequest } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TodoTemplate | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'todo' | 'template';
    id: number;
    title: string;
  } | null>(null);

  // Form state for todo
  const [formData, setFormData] = useState<TodoRequest>({
    title: '',
    description: '',
    dueDate: selectedDate,
    priority: 'MEDIUM',
  });

  // Form state for template
  const [templateForm, setTemplateForm] = useState<TodoTemplateRequest>({
    title: '',
    icon: '',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    loadTodos();
  }, [selectedDate]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTodos = async () => {
    setIsLoading(true);
    try {
      const res = await todoApi.getByDate(selectedDate);
      setTodos(res.data.data || []);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await todoTemplateApi.getAll();
      console.log({ res });
      setTemplates(res.data.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateTodo = async () => {
    if (!formData.title.trim()) return;

    try {
      const res = await todoApi.create({
        ...formData,
        dueDate: selectedDate,
      });
      setTodos(prev => [...prev, res.data.data]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !formData.title.trim()) return;

    try {
      const res = await todoApi.update(editingTodo.id, formData);
      setTodos(prev => prev.map(t => (t.id === editingTodo.id ? res.data.data : t)));
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const res = await todoApi.toggle(todo.id);
      setTodos(prev => prev.map(t => (t.id === todo.id ? res.data.data : t)));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'todo') {
        await todoApi.delete(deleteTarget.id);
        setTodos(prev => prev.filter(t => t.id !== deleteTarget.id));
      } else {
        await todoTemplateApi.delete(deleteTarget.id);
        setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const confirmDeleteTodo = (todo: Todo) => {
    setDeleteTarget({ type: 'todo', id: todo.id, title: todo.title });
  };

  const confirmDeleteTemplate = (template: TodoTemplate) => {
    setDeleteTarget({ type: 'template', id: template.id, title: template.title });
  };

  // ===== Template handlers =====
  const handleSelectTemplate = (template: TodoTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      priority: template.priority,
    });
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.title.trim()) return;

    try {
      const res = await todoTemplateApi.create(templateForm);
      setTemplates(prev => [...prev, res.data.data]);
      resetTemplateForm();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !templateForm.title.trim()) return;

    try {
      const res = await todoTemplateApi.update(editingTemplate.id, templateForm);
      setTemplates(prev => prev.map(t => (t.id === editingTemplate.id ? res.data.data : t)));
      resetTemplateForm();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const openEditTemplate = (template: TodoTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      icon: template.icon || '',
      priority: template.priority,
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      title: '',
      icon: '',
      priority: 'MEDIUM',
    });
    setEditingTemplate(null);
    setIsTemplateDialogOpen(false);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate,
      priority: todo.priority,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTodo(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: selectedDate,
      priority: 'MEDIUM',
    });
    setEditingTodo(null);
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Todo List</h1>
          <p className="text-muted-foreground">Quản lý công việc theo ngày</p>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => changeDate(-1)}>
                ← Hôm trước
              </Button>

              <div className="text-center">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-auto text-center border-none shadow-none text-lg font-medium"
                />
                <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
              </div>

              <Button variant="outline" size="sm" onClick={() => changeDate(1)}>
                Ngày sau →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              {completedCount}/{totalCount} hoàn thành
            </Badge>

            <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chưa xong</SelectItem>
                <SelectItem value="completed">Đã xong</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Thêm Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTodo ? 'Sửa Todo' : 'Thêm Todo Mới'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Quick select templates */}
                {!editingTodo && templates.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Chọn nhanh</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setIsTemplateDialogOpen(true)}
                      >
                        <SettingsIcon className="h-3 w-3 mr-1" />
                        Quản lý
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templates.map(template => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs',
                            formData.title === template.title && 'ring-2 ring-primary'
                          )}
                          onClick={() => handleSelectTemplate(template)}
                        >
                          {template.icon && <span className="mr-1">{template.icon}</span>}
                          {template.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No templates message */}
                {!editingTodo && templates.length === 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Chưa có template nào. Tạo templates để chọn nhanh!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTemplateDialogOpen(true)}
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Tạo Template
                    </Button>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Tiêu đề *</label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề todo..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Mô tả</label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết (tùy chọn)..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Ngày</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Độ ưu tiên</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: Priority) => setFormData({ ...formData, priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Thấp</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="HIGH">Cao</SelectItem>
                        <SelectItem value="CRITICAL">Rất cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Hủy</Button>
                </DialogClose>
                <Button
                  onClick={editingTodo ? handleUpdateTodo : handleCreateTodo}
                  disabled={!formData.title.trim()}
                >
                  {editingTodo ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đang tải...
              </CardContent>
            </Card>
          ) : filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="mb-2">Không có todo nào cho ngày này</p>
                <Button variant="outline" size="sm" onClick={openCreateDialog}>
                  Thêm todo đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map(todo => (
              <Card key={todo.id} className={cn('transition-all', todo.completed && 'opacity-60')}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggle(todo)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={cn(
                            'font-medium',
                            todo.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {todo.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getPriorityColor(todo.priority))}
                        >
                          {todo.priority === 'CRITICAL'
                            ? 'Rất cao'
                            : todo.priority === 'HIGH'
                              ? 'Cao'
                              : todo.priority === 'MEDIUM'
                                ? 'TB'
                                : 'Thấp'}
                        </Badge>
                      </div>

                      {todo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {todo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(todo)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => confirmDeleteTodo(todo)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Template Management Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quản lý Templates</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add/Edit Template Form */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">
                {editingTemplate ? 'Sửa Template' : 'Thêm Template Mới'}
              </h4>

              <div className="grid grid-cols-[1fr_60px] gap-2">
                <Input
                  value={templateForm.title}
                  onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                  placeholder="Tiêu đề..."
                />
                <Input
                  value={templateForm.icon}
                  onChange={e => setTemplateForm({ ...templateForm, icon: e.target.value })}
                  placeholder="🎯"
                  className="text-center"
                  maxLength={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={templateForm.priority}
                  onValueChange={(v: Priority) => setTemplateForm({ ...templateForm, priority: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Thấp</SelectItem>
                    <SelectItem value="MEDIUM">Trung bình</SelectItem>
                    <SelectItem value="HIGH">Cao</SelectItem>
                    <SelectItem value="CRITICAL">Rất cao</SelectItem>
                  </SelectContent>
                </Select>

                {editingTemplate ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdateTemplate}
                      disabled={!templateForm.title.trim()}
                    >
                      Lưu
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetTemplateForm}>
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleCreateTemplate}
                    disabled={!templateForm.title.trim()}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                )}
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Chưa có template nào
                </p>
              ) : (
                templates.map(template => (
                  <div
                    key={template.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg border',
                      editingTemplate?.id === template.id && 'bg-primary/10 border-primary'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {template.icon && <span>{template.icon}</span>}
                      <span className="font-medium">{template.title}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getPriorityColor(template.priority))}
                      >
                        {template.priority === 'CRITICAL'
                          ? 'Rất cao'
                          : template.priority === 'HIGH'
                            ? 'Cao'
                            : template.priority === 'MEDIUM'
                              ? 'TB'
                              : 'Thấp'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditTemplate(template)}
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => confirmDeleteTemplate(template)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Đóng</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa {deleteTarget?.type === 'todo' ? 'todo' : 'template'}{' '}
              <strong>"{deleteTarget?.title}"</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Icons
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
