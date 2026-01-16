import React from 'react';
import { 
  Plus, 
  UserPlus, 
  MoreHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: 'Invited' | 'Suspended' | 'Inactive' | 'Active';
  role: 'Cashier' | 'Admin' | 'Manager' | 'Superadmin';
}

const users: User[] = [
  { id: '1', username: 'freeman.dicki', name: 'Freeman Dicki', email: 'freeman83@gmail.com', phone: '+16972759140', status: 'Invited', role: 'Cashier' },
  { id: '2', username: 'nick.bashirian-lowe', name: 'Nick Bashirian-Lowe', email: 'nick_donnelly@gmail.com', phone: '+17425632370', status: 'Invited', role: 'Admin' },
  { id: '3', username: 'ardith_jast', name: 'Ardith Jast', email: 'ardith_crist@gmail.com', phone: '+13553118532', status: 'Suspended', role: 'Cashier' },
  { id: '4', username: 'jeffrey_collins81', name: 'Jeffrey Collins', email: 'jeffrey.stark98@hotmail.com', phone: '+14646410541', status: 'Inactive', role: 'Manager' },
  { id: '5', username: 'ashton.auer', name: 'Ashton Auer', email: 'ashton_hegmann67@yahoo.com', phone: '+14345495030', status: 'Suspended', role: 'Superadmin' },
  { id: '6', username: 'golda.gleason', name: 'Golda Gleason', email: 'golda.smith32@gmail.com', phone: '+14606427316', status: 'Active', role: 'Manager' },
  { id: '7', username: 'maurine.rutherford', name: 'Maurine Rutherford', email: 'maurine_bechtelar@gmail.com', phone: '+16544865144', status: 'Suspended', role: 'Manager' },
];

const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
  const styles = {
    Invited: "bg-blue-50 text-blue-600 border-blue-100",
    Suspended: "bg-red-50 text-red-600 border-red-100",
    Inactive: "bg-gray-100 text-gray-500 border-gray-200",
    Active: "bg-green-50 text-green-600 border-green-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", styles[status])}>
      {status}
    </span>
  );
};

const UserListContent: React.FC = () => {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User List</h1>
          <p className="text-muted-foreground mt-1">Manage your users and their roles here.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm border-2">
            Invite User <UserPlus size={16} />
          </Button>
          <Button className="gap-2 text-sm bg-slate-900 border-2">
            Add User <Plus size={16} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input 
              placeholder="Filter users..." 
              className="h-8 w-64 rounded-md border text-sm px-3 placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-dashed">
             <Plus size={14} className="text-muted-foreground" /> Status
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-dashed">
             <Plus size={14} className="text-muted-foreground" /> Role
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
           <LayoutGrid size={14} /> View
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50/50">
              <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" /></th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">
                <div className="flex items-center gap-1">Username <ArrowUpDown size={14}/></div>
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">
                <div className="flex items-center gap-1">Email <ArrowUpDown size={14}/></div>
              </th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Phone Number</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-50/80 transition-colors last:border-0 group">
                <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                <td className="px-4 py-3 font-medium">{user.username}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">{user.phone}</td>
                <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} />
                    {user.role}
                  </div>
                </td>
                <td className="px-4 py-3">
                   <button className="p-1 hover:bg-slate-200 rounded-md text-muted-foreground">
                     <MoreHorizontal size={16} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListContent;
