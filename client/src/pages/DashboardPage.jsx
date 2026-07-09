import { useEffect, useState } from 'react'
import { AppIcon } from '../components/AppIcon'
import { PageHeader } from '../components/PageHeader'
import { getDashboard } from '../lib/api'

const iconColors = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  green: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-secondary-container text-primary',
}

export function DashboardPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getDashboard().then(setData)
  }, [])

  if (!data) {
    return <div className="fade-up text-sm text-on-surface-variant">Загрузка панели...</div>
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Панель"
        description="Обзор клиентской базы и активности по последним изменениям."
      />

      <section className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {data.stats.map((item) => (
          <article key={item.label} className="card-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className={`rounded-lg p-2 ${iconColors[item.tone] ?? iconColors.primary}`}>
                <AppIcon
                  name={
                    item.tone === 'primary'
                      ? 'group'
                      : item.tone === 'blue'
                        ? 'inbox'
                        : item.tone === 'orange'
                          ? 'gavel'
                          : item.tone === 'green'
                            ? 'checkCircle'
                            : 'analytics'
                  }
                  className="h-6 w-6"
                />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">{item.meta}</span>
            </div>
            <p className="text-sm text-on-surface-variant">{item.label}</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight">{item.value}</h3>
            {item.progress ? (
              <div className="mt-4 h-1.5 rounded-full bg-surface-container">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="card-panel p-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Последняя активность</h3>
        </div>
        <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-0.5 before:bg-surface-container">
          {data.recentActivities.map((activity) => (
            <div key={activity.id} className="relative pl-12">
              <div className="absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary ring-4 ring-surface-container-lowest">
                <AppIcon name="history" className="h-[18px] w-[18px]" />
              </div>
              <p className="text-sm font-semibold text-on-surface">{activity.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-outline">
                <span>{activity.time}</span>
                <span>&bull;</span>
                <span>{activity.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
