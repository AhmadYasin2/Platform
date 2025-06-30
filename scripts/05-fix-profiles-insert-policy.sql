-- Allow a user to insert a profile row when the row's id matches auth.uid()
create policy "Users can insert own profile"
on profiles
for insert
with check ( auth.uid() = id );
