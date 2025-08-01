import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, UserRole } from '@/types/user';
import { useUserManagement } from '@/hooks/useUserManagement';
import BrokerPermissions from '@/components/BrokerPermissions';

interface UserManagementProps {
  language: 'ru' | 'en' | 'cn';
}

const UserManagement: React.FC<UserManagementProps> = ({ language }) => {
  const { users, createUser, updateUser, deleteUser } = useUserManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showBrokerPermissions, setShowBrokerPermissions] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'viewer' as UserRole
  });

  // Функция для копирования ссылки в буфер обмена
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Ссылка для входа скопирована в буфер обмена!');
    } catch (err) {
      console.error('Ошибка при копировании:', err);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Ссылка для входа скопирована в буфер обмена!');
    }
  };

  // Генерация специальной ссылки для пользователя
  const generateSpecialLink = (userId: string, userRole: string) => {
    const baseUrl = window.location.origin;
    // Добавляем роль в ссылку для уникальности
    return `${baseUrl}/?auto-login=${userId}&role=${userRole}`;
  };

  const t = {
    ru: {
      title: 'Управление пользователями',
      addUser: 'Добавить пользователя',
      username: 'Имя пользователя',
      email: 'Email',
      role: 'Роль',
      status: 'Статус',
      created: 'Создан',
      lastLogin: 'Последний вход',
      actions: 'Действия',
      active: 'Активен',
      inactive: 'Неактивен',
      save: 'Сохранить',
      cancel: 'Отменить',
      edit: 'Редактировать',
      delete: 'Удалить',
      specialLink: 'Спец. ссылка',
      copyLink: 'Копировать ссылку',
      roles: {
        admin: 'Администратор',
        editor: 'Редактор',
        viewer: 'Наблюдатель',
        chinese_only: 'Только китайская версия',
        broker: 'Брокер'
      }
    },
    en: {
      title: 'User Management',
      addUser: 'Add User',
      username: 'Username',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      created: 'Created',
      lastLogin: 'Last Login',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      specialLink: 'Special Link',
      copyLink: 'Copy Link',
      roles: {
        admin: 'Administrator',
        editor: 'Editor',
        viewer: 'Viewer',
        chinese_only: 'Chinese Only',
        broker: 'Broker'
      }
    },
    cn: {
      title: '用户管理',
      addUser: '添加用户',
      username: '用户名',
      email: '邮箱',
      role: '角色',
      status: '状态',
      created: '创建时间',
      lastLogin: '最后登录',
      actions: '操作',
      active: '活跃',
      inactive: '非活跃',
      save: '保存',
      cancel: '取消',
      edit: '编辑',
      delete: '删除',
      specialLink: '专用链接',
      copyLink: '复制链接',
      roles: {
        admin: '管理员',
        editor: '编辑者',
        viewer: '查看者',
        chinese_only: '仅中文版本',
        broker: '经纪人'
      }
    }
  };

  const currentT = t[language];

  const handleAddUser = () => {
    if (newUser.username.trim()) {
      createUser({
        ...newUser,
        isActive: true
      });
      setNewUser({ username: '', email: '', role: 'viewer' });
      setShowAddForm(false);
    }
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    updateUser(userId, updates);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUser(userId);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'cn' ? 'zh-CN' : 'en-US');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{currentT.title}</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowBrokerPermissions(true)} variant="outline">
            <Icon name="Settings" size={16} className="mr-2" />
            Настройка прав брокеров
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Icon name="Plus" size={16} className="mr-2" />
            {currentT.addUser}
          </Button>
        </div>
      </div>

      {/* Форма добавления пользователя */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{currentT.addUser}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{currentT.username}</label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder={currentT.username}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{currentT.email}</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder={currentT.email}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{currentT.role}</label>
              <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{currentT.roles.admin}</SelectItem>
                  <SelectItem value="editor">{currentT.roles.editor}</SelectItem>
                  <SelectItem value="viewer">{currentT.roles.viewer}</SelectItem>
                  <SelectItem value="chinese_only">{currentT.roles.chinese_only}</SelectItem>
                  <SelectItem value="broker">{currentT.roles.broker || 'Брокер'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddUser}>{currentT.save}</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>{currentT.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список пользователей */}
      <div className="grid gap-4">
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  
                  <div>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {currentT.roles[user.role]}
                    </Badge>
                  </div>
                  
                  <div>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? currentT.active : currentT.inactive}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    {formatDate(user.createdAt)}
                  </div>
                  
                  <div className="text-sm">
                    {user.lastLogin ? formatDate(user.lastLogin) : '-'}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(user.role === 'victor' || user.role === 'admin') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateSpecialLink(user.id, user.role))}
                        title="Скопировать ссылку для входа"
                      >
                        <Icon name="Link" size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Форма редактирования */}
              {editingUser === user.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{currentT.username}</label>
                      <Input
                        defaultValue={user.username}
                        onBlur={(e) => handleUpdateUser(user.id, { username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{currentT.role}</label>
                      <Select 
                        value={user.role} 
                        onValueChange={(value: UserRole) => handleUpdateUser(user.id, { role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{currentT.roles.admin}</SelectItem>
                          <SelectItem value="editor">{currentT.roles.editor}</SelectItem>
                          <SelectItem value="viewer">{currentT.roles.viewer}</SelectItem>
                          <SelectItem value="chinese_only">{currentT.roles.chinese_only}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{currentT.status}</label>
                      <Select 
                        value={user.isActive ? 'active' : 'inactive'} 
                        onValueChange={(value) => handleUpdateUser(user.id, { isActive: value === 'active' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{currentT.active}</SelectItem>
                          <SelectItem value="inactive">{currentT.inactive}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {user.specialLink && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{currentT.specialLink}</label>
                      <div className="flex gap-2">
                        <Input value={window.location.origin + user.specialLink} readOnly />
                        <Button onClick={() => copyToClipboard(user.specialLink!)}>
                          {currentT.copyLink}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Модальное окно настройки прав брокеров */}
      {showBrokerPermissions && (
        <BrokerPermissions onClose={() => setShowBrokerPermissions(false)} />
      )}
    </div>
  );
};

export default UserManagement;