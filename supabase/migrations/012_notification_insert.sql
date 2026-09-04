-- Allow teachers to insert their own notifications
create policy "Teachers can insert their own notifications"
    on notifications for insert
    with check (auth.uid() = teacher_id);
