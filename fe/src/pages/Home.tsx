import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: UsersIcon,
      title: 'Quản lý Users',
      description: 'Tạo, sửa, xóa và quản lý người dùng trong hệ thống',
      link: '/users',
      color: 'bg-blue-500',
    },
    {
      icon: FileTextIcon,
      title: 'Posts',
      description: 'Xem và tạo bài viết từ JSONPlaceholder API',
      link: '/posts',
      color: 'bg-green-500',
    },
    {
      icon: MessageCircleIcon,
      title: 'Chat Real-time',
      description: 'Nhắn tin trực tiếp với người dùng khác qua WebSocket',
      link: '/chat',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="container max-w-6xl py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/25">
            <LifeHubIcon className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Chào mừng đến <span className="text-primary">LifeHub</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Ứng dụng all-in-one cho cuộc sống hàng ngày: quản lý công việc, học tập, chat và nhiều
          tính năng khác.
        </p>

        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link to="/login">
                <LoginIcon className="mr-2 h-5 w-5" />
                Đăng nhập
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link to="/register">
                <UserPlusIcon className="mr-2 h-5 w-5" />
                Đăng ký
              </Link>
            </Button>
          </div>
        ) : (
          <Button size="lg" asChild className="h-12 px-8 text-base">
            <Link to="/users">
              <ArrowRightIcon className="mr-2 h-5 w-5" />
              Bắt đầu sử dụng
            </Link>
          </Button>
        )}
      </section>

      {/* Features Section */}
      <section className="container max-w-6xl pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tính năng chính</h2>
          <p className="text-muted-foreground">Khám phá các tính năng của LifeHub</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg transition-all hover:border-primary/50"
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="gap-2 -ml-4">
                  <Link to={feature.link}>
                    Xem thêm
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t bg-muted/30">
        <div className="container max-w-6xl py-12">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Công nghệ sử dụng</h3>
            <p className="text-sm text-muted-foreground">
              Được xây dựng với các công nghệ hiện đại
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'React',
              'TypeScript',
              'TailwindCSS',
              'shadcn/ui',
              'TanStack Query',
              'Spring Boot',
              'WebSocket',
            ].map(tech => (
              <span
                key={tech}
                className="px-4 py-2 bg-background rounded-full border text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Icons
const LifeHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const LoginIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
    />
  </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7l5 5m0 0l-5 5m5-5H6"
    />
  </svg>
);

export default Home;
