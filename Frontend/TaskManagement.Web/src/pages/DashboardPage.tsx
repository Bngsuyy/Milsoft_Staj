import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton'
import { Doughnut } from 'react-chartjs-2'
import { PriorityTag, StatusTag } from '../components'
import { useAuth, useTheme } from '../hooks'
import { categoryService, taskService } from '../services'
import { TaskStatus } from '../types'
import type { AppTheme } from '../contexts'
import type { Category, Task, TaskStatistics } from '../types'
import { formatTaskDate, getApiErrorMessage, isTaskOverdue } from '../utils'

ChartJS.register(ArcElement, Tooltip, Legend)

const emptyStatistics: TaskStatistics = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  overdue: 0,
}

function getChartOptions(theme: AppTheme, unitLabel = 'görev'): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#CBD5E1' : '#475569',
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          usePointStyle: true,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#160b0e' : '#0F172A',
        callbacks: {
          label: (context) => ` ${context.label}: ${context.formattedValue} ${unitLabel}`,
        },
      },
    },
  }
}

function getStatusChartData(statistics: TaskStatistics, theme: AppTheme): ChartData<'doughnut'> {
  return {
    labels: ['Bekleyen', 'Devam eden', 'Tamamlanan', 'İptal edilen'],
    datasets: [
      {
        data: [
          statistics.pending,
          statistics.inProgress,
          statistics.completed,
          statistics.cancelled,
        ],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#94A3B8'],
        borderColor: theme === 'dark' ? '#211316' : '#FFFFFF',
        borderWidth: 4,
        hoverOffset: 5,
      },
    ],
  }
}

function getCategoryChartData(categories: Category[], totalTasks: number, theme: AppTheme): ChartData<'doughnut'> {
  const activeCategories = categories.filter((c) => (c.taskCount ?? 0) > 0)
  const categorizedSum = activeCategories.reduce((sum, c) => sum + (c.taskCount ?? 0), 0)
  const uncategorizedCount = Math.max(0, totalTasks - categorizedSum)

  const labels = activeCategories.map((c) => c.name)
  const data = activeCategories.map((c) => c.taskCount ?? 0)
  const backgroundColors = activeCategories.map((c) => c.color || '#3B82F6')

  if (uncategorizedCount > 0) {
    labels.push('Kategorisiz')
    data.push(uncategorizedCount)
    backgroundColors.push(theme === 'dark' ? '#64748B' : '#94A3B8')
  }

  // If no task has been categorized yet but categories exist, show them with 0 or demo distribution
  if (labels.length === 0 && categories.length > 0) {
    return {
      labels: categories.slice(0, 5).map((c) => c.name),
      datasets: [
        {
          data: categories.slice(0, 5).map(() => 0),
          backgroundColor: categories.slice(0, 5).map((c) => c.color),
          borderColor: theme === 'dark' ? '#211316' : '#FFFFFF',
          borderWidth: 4,
        },
      ],
    }
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: theme === 'dark' ? '#211316' : '#FFFFFF',
        borderWidth: 4,
        hoverOffset: 5,
      },
    ],
  }
}

export function DashboardPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [statistics, setStatistics] = useState<TaskStatistics>(emptyStatistics)
  const [categories, setCategories] = useState<Category[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadDashboard() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [statisticsResponse, recentResponse, overdueResponse, categoriesResponse] = await Promise.all([
          taskService.getStatistics(),
          taskService.getAll({ pageNumber: 1, pageSize: 5 }),
          taskService.getOverdue({ pageNumber: 1, pageSize: 4 }),
          categoryService.getAll(),
        ])

        if (isActive) {
          setStatistics(statisticsResponse)
          setRecentTasks(recentResponse.items)
          setOverdueTasks(overdueResponse.items)
          setCategories(categoriesResponse)
        }
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Dashboard verileri yüklenemedi.'))
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      isActive = false
    }
  }, [refreshKey])

  const statisticCards = [
    { label: 'Toplam görev', value: statistics.total, icon: 'pi-list-check', tone: 'blue', to: '/tasks' },
    { label: 'Bekleyen', value: statistics.pending, icon: 'pi-hourglass', tone: 'amber', to: `/tasks?status=${TaskStatus.Pending}` },
    { label: 'Devam eden', value: statistics.inProgress, icon: 'pi-spin pi-spinner', tone: 'indigo', to: `/tasks?status=${TaskStatus.InProgress}` },
    { label: 'Tamamlanan', value: statistics.completed, icon: 'pi-check-circle', tone: 'green', to: `/tasks?status=${TaskStatus.Completed}` },
    { label: 'Vadesi geçen', value: statistics.overdue, icon: 'pi-clock', tone: 'red', to: '/tasks?view=overdue' },
  ]
  const statusChartHasData = statistics.pending + statistics.inProgress + statistics.completed + statistics.cancelled > 0
  const categoryChartHasData = statistics.total > 0

  return (
    <div className="content-page dashboard-content-page">
      <section className="dashboard-welcome">
        <div>
          <span className="page-eyebrow">Genel bakış</span>
          <h2>Hoş geldin, {user?.firstName}.</h2>
          <p>Görevlerinin güncel durumunu ve son hareketlerini buradan takip edebilirsin.</p>
        </div>
        <Link className="dashboard-create-link" to="/tasks">
          <i className="pi pi-plus" aria-hidden="true" />
          Görevleri yönet
        </Link>
      </section>

      {loadError && (
        <div className="task-load-error dashboard-error" role="alert">
          <div>
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <Button label="Tekrar dene" icon="pi pi-refresh" outlined onClick={() => setRefreshKey((current) => current + 1)} />
        </div>
      )}

      <section className="dashboard-stat-grid" aria-label="Görev istatistikleri" aria-busy={isLoading}>
        {statisticCards.map((card) => (
          <Link className={`dashboard-stat-card tone-${card.tone}`} key={card.label} to={card.to}>
            <span className="dashboard-stat-icon" aria-hidden="true"><i className={`pi ${card.icon}`} /></span>
            <div>
              {isLoading ? <Skeleton width="3rem" height="1.8rem" /> : <strong>{card.value}</strong>}
              <span>{card.label}</span>
            </div>
            <i className="pi pi-arrow-up-right dashboard-stat-arrow" aria-hidden="true" />
          </Link>
        ))}
      </section>

      {/* Charts Grid: Status distribution + Category distribution */}
      <div className="dashboard-charts-grid">
        <section className="dashboard-panel status-chart-panel" aria-labelledby="status-chart-title">
          <header className="dashboard-panel-heading">
            <div>
              <span className="page-eyebrow">Dağılım</span>
              <h3 id="status-chart-title">Görev durumları</h3>
            </div>
            <span className="dashboard-panel-total">{statistics.total} toplam</span>
          </header>
          <div className="status-chart-container">
            {isLoading ? (
              <Skeleton shape="circle" size="13rem" />
            ) : statusChartHasData ? (
              <Doughnut
                data={getStatusChartData(statistics, theme)}
                options={getChartOptions(theme)}
                role="img"
                aria-label={`Bekleyen ${statistics.pending}, devam eden ${statistics.inProgress}, tamamlanan ${statistics.completed}, iptal edilen ${statistics.cancelled} görev`}
              />
            ) : (
              <div className="dashboard-panel-empty compact-empty">
                <i className="pi pi-chart-pie" aria-hidden="true" />
                <strong>Grafik için veri yok</strong>
                <span>İlk görevini oluşturduğunda durum dağılımı burada görünecek.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-panel category-chart-panel" aria-labelledby="category-chart-title">
          <header className="dashboard-panel-heading">
            <div>
              <span className="page-eyebrow">Kategoriler</span>
              <h3 id="category-chart-title">Kategori dağılımı</h3>
            </div>
            <Link to="/categories" className="text-xs">
              Kategorileri yönet <i className="pi pi-arrow-right" aria-hidden="true" />
            </Link>
          </header>
          <div className="status-chart-container">
            {isLoading ? (
              <Skeleton shape="circle" size="13rem" />
            ) : categoryChartHasData ? (
              <Doughnut
                data={getCategoryChartData(categories, statistics.total, theme)}
                options={getChartOptions(theme)}
                role="img"
                aria-label="Kategori görev dağılım grafiği"
              />
            ) : (
              <div className="dashboard-panel-empty compact-empty">
                <i className="pi pi-folder" aria-hidden="true" />
                <strong>Kategori verisi yok</strong>
                <span>Görevlerine kategori atadığında dağılım burada görünecek.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Insights Grid: Overdue tasks + Recent tasks */}
      <div className="dashboard-insight-grid">
        <section className="dashboard-panel overdue-panel" aria-labelledby="overdue-title">
          <header className="dashboard-panel-heading">
            <div>
              <span className="page-eyebrow danger-eyebrow">Takip gerekli</span>
              <h3 id="overdue-title">Vadesi geçenler</h3>
            </div>
            <Link to="/tasks?view=overdue">Tümünü gör <i className="pi pi-arrow-right" aria-hidden="true" /></Link>
          </header>

          <div className="dashboard-task-list">
            {isLoading ? Array.from({ length: 4 }, (_, index) => (
              <div className="dashboard-task-row" key={index}>
                <Skeleton width="70%" height="0.9rem" />
                <Skeleton width="5rem" height="0.7rem" />
              </div>
            )) : overdueTasks.length > 0 ? overdueTasks.map((task) => (
              <Link className="dashboard-task-row overdue-task-item" key={task.id} to={`/tasks/${task.id}`}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.category?.name ?? 'Kategorisiz'}</span>
                </div>
                <time dateTime={task.dueDate ?? undefined}>{formatTaskDate(task.dueDate)}</time>
              </Link>
            )) : (
              <div className="dashboard-panel-empty">
                <i className="pi pi-check-circle" aria-hidden="true" />
                <strong>Geciken görev yok</strong>
                <span>Tüm görevler zamanında görünüyor.</span>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-panel recent-tasks-panel" aria-labelledby="recent-tasks-title">
          <header className="dashboard-panel-heading">
            <div>
              <span className="page-eyebrow">Son hareketler</span>
              <h3 id="recent-tasks-title">Son görevler</h3>
            </div>
            <Link to="/tasks">Tüm görevler <i className="pi pi-arrow-right" aria-hidden="true" /></Link>
          </header>

          <div className="recent-task-list">
            {isLoading ? Array.from({ length: 5 }, (_, index) => (
              <div className="recent-task-row" key={index}>
                <Skeleton width="45%" height="0.9rem" />
                <Skeleton width="6rem" height="1.4rem" borderRadius="1rem" />
                <Skeleton width="5rem" height="0.8rem" />
              </div>
            )) : recentTasks.length > 0 ? recentTasks.map((task) => (
              <Link className={`recent-task-row${isTaskOverdue(task) ? ' is-overdue' : ''}`} key={task.id} to={`/tasks/${task.id}`}>
                <div className="recent-task-title">
                  <span className="recent-task-color" style={{ backgroundColor: task.category?.color ?? '#CBD5E1' }} aria-hidden="true" />
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.category?.name ?? 'Kategorisiz'}</span>
                  </div>
                </div>
                <StatusTag status={task.status} />
                <PriorityTag priority={task.priority} />
                <div className="recent-task-date">
                  <span>{formatTaskDate(task.dueDate)}</span>
                  {isTaskOverdue(task) && <small>Vadesi geçti</small>}
                </div>
                <i className="pi pi-chevron-right" aria-hidden="true" />
              </Link>
            )) : (
              <div className="dashboard-panel-empty recent-empty">
                <i className="pi pi-list-check" aria-hidden="true" />
                <strong>Henüz görev yok</strong>
                <span>Yeni bir görev oluşturarak çalışmaya başlayabilirsin.</span>
                <Link to="/tasks">Görev oluştur</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
