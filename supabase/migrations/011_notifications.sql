create table notifications (
    id uuid default gen_random_uuid() primary key,
    teacher_id uuid references teachers(id) on delete cascade not null,
    type text check (type in ('info', 'success', 'warning', 'error')) not null default 'info',
    title text not null,
    message text not null,
    link_url text,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table notifications enable row level security;

create policy "Teachers can view their own notifications"
    on notifications for select
    using (auth.uid() = teacher_id);

create policy "Teachers can update their own notifications"
    on notifications for update
    using (auth.uid() = teacher_id);

create policy "Teachers can delete their own notifications"
    on notifications for delete
    using (auth.uid() = teacher_id);
