// 后端国际化工具类
export type SupportedLocale = 'en' | 'zh';

interface TranslationMessages {
  [key: string]: string | TranslationMessages;
}

// 后端错误消息和响应文本的翻译
const messages: Record<SupportedLocale, TranslationMessages> = {
  en: {
    auth: {
      unauthorized: 'Unauthorized access, please login first',
      tokenInvalid: 'Invalid or expired token',
      userNotFound: 'User not found',
      emailExists: 'Email already exists',
      walletExists: 'Wallet address already registered',
      loginSuccess: 'Login successful',
      loginError: 'Login failed',
      signupSuccess: 'Registration successful',
      signupError: 'Registration failed'
    },
    hackathons: {
      notFound: 'Hackathon not found',
      createSuccess: 'Hackathon created successfully',
      createError: 'Failed to create hackathon',
      joinSuccess: 'Successfully joined hackathon',
      joinError: 'Failed to join hackathon',
      alreadyJoined: 'Already joined this hackathon',
      registrationClosed: 'Registration period has ended',
      invalidDateRange: 'End date must be after start date',
      invalidRegistrationDeadline: 'Registration deadline must be before start date',
      getListError: 'Failed to get hackathon list',
      getDetailsError: 'Failed to get hackathon details',
      privateEvent: 'This hackathon is a private event',
      organizerNotFound: 'Organizer information not found',
      organizerCannotJoin: 'Organizer cannot join their own hackathon'
    },
    teams: {
      notFound: 'Team not found',
      createSuccess: 'Team created successfully',
      createError: 'Failed to create team',
      joinSuccess: 'Successfully joined team',
      joinError: 'Failed to join team',
      alreadyInTeam: 'Already joined a team for this hackathon',
      teamFull: 'Team is already full',
      nameExists: 'Team name already exists in this hackathon',
      applicationSent: 'Application sent successfully',
      applicationApproved: 'Application approved',
      applicationRejected: 'Application rejected',
      inviteSent: 'Invitation sent successfully',
      needRegistration: 'Please register for the hackathon first',
      getListError: 'Failed to get team list',
      getDetailsError: 'Failed to get team details',
      updateError: 'Failed to update team',
      deleteError: 'Failed to delete team',
      deleteSuccess: 'Team deleted successfully',
      onlyLeaderCanModify: 'Only team leader can modify team information',
      onlyLeaderCanDelete: 'Only team leader can delete team',
      onlyLeaderCanInvite: 'Only team leader can invite members',
      onlyLeaderCanViewApplications: 'Only team leader can view applications',
      invitedUserNotFound: 'Invited user not found',
      alreadyTeamMember: 'User is already a team member',
      userNotRegistered: 'Invited user has not registered for this hackathon',
      alreadyInOtherTeam: 'Invited user has already joined another team',
      pendingInvitationExists: 'User already has a pending team invitation',
      inviteError: 'Failed to send invitation',
      getApplicationsError: 'Failed to get applications list',
      notTeamMember: 'You are not a member of this team'
    },
    projects: {
      notFound: 'Project not found',
      createSuccess: 'Project created successfully',
      createError: 'Failed to create project',
      submitSuccess: 'Project submitted successfully',
      submitError: 'Failed to submit project',
      updateSuccess: 'Project updated successfully',
      updateError: 'Failed to update project',
      alreadySubmitted: 'Already submitted a project for this hackathon',
      getListError: 'Failed to get project list',
      getDetailsError: 'Failed to get project details',
      deleteSuccess: 'Project deleted successfully',
      deleteError: 'Failed to delete project',
      onlyTeamMemberCanModify: 'Only project team members can modify project information',
      onlyLeaderCanDelete: 'Only team leader can delete project',
      hackathonNotStarted: 'Hackathon has not started yet, cannot submit project',
      hackathonEnded: 'Hackathon has ended, cannot submit project',
      hackathonStartsAt: 'Hackathon will start at {startTime}',
      hackathonEndedAt: 'Hackathon ended at {endTime}',
      alreadyLiked: 'You have already liked this project',
      likeSuccess: 'Liked successfully',
      likeError: 'Failed to like project',
      notLikedYet: 'You have not liked this project yet',
      unlikeSuccess: 'Unliked successfully',
      unlikeError: 'Failed to unlike project'
    },
    community: {
      postNotFound: 'Post not found',
      createPostSuccess: 'Post created successfully',
      createPostError: 'Failed to create post',
      likeSuccess: 'Liked successfully',
      unlikeSuccess: 'Unliked successfully',
      bookmarkSuccess: 'Bookmarked successfully',
      unbookmarkSuccess: 'Removed from bookmarks'
    },
    notifications: {
      markReadSuccess: 'Marked as read',
      clearSuccess: 'Notifications cleared',
      sendSuccess: 'Notification sent successfully'
    },
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      passwordTooShort: 'Password must be at least 8 characters',
      invalidDate: 'Invalid date format',
      fileTooLarge: 'File size too large',
      invalidFileType: 'Invalid file type'
    },
    errors: {
      serverError: 'Internal server error',
      networkError: 'Network connection error',
      validationError: 'Data validation failed',
      permissionDenied: 'Permission denied',
      rateLimitExceeded: 'Too many requests, please try again later'
    }
  },
  zh: {
    auth: {
      unauthorized: '未授权访问，请先登录',
      tokenInvalid: 'Token无效或已过期',
      userNotFound: '用户不存在',
      emailExists: '邮箱已存在',
      walletExists: '钱包地址已注册',
      loginSuccess: '登录成功',
      loginError: '登录失败',
      signupSuccess: '注册成功',
      signupError: '注册失败'
    },
    hackathons: {
      notFound: '黑客松不存在',
      createSuccess: '黑客松创建成功',
      createError: '创建黑客松失败',
      joinSuccess: '成功加入黑客松',
      joinError: '加入黑客松失败',
      alreadyJoined: '已经加入了此黑客松',
      registrationClosed: '报名时间已结束',
      invalidDateRange: '结束日期必须晚于开始日期',
      invalidRegistrationDeadline: '注册截止日期必须早于开始日期',
      getListError: '获取黑客松列表失败',
      getDetailsError: '获取黑客松详情失败',
      privateEvent: '该黑客松为私有活动',
      organizerNotFound: '组织者信息不存在',
      organizerCannotJoin: '创建者不能参加自己创建的黑客松'
    },
    teams: {
      notFound: '团队不存在',
      createSuccess: '团队创建成功',
      createError: '创建团队失败',
      joinSuccess: '成功加入团队',
      joinError: '加入团队失败',
      alreadyInTeam: '您已经加入了该黑客松的其他团队',
      teamFull: '团队已满员',
      nameExists: '该黑客松中已存在同名团队',
      applicationSent: '申请已发送',
      applicationApproved: '申请已批准',
      applicationRejected: '申请已拒绝',
      inviteSent: '邀请已发送',
      needRegistration: '您需要先报名参加该黑客松',
      getListError: '获取团队列表失败',
      getDetailsError: '获取团队详情失败',
      updateError: '更新团队失败',
      deleteError: '删除团队失败',
      deleteSuccess: '团队删除成功',
      onlyLeaderCanModify: '只有队长可以修改团队信息',
      onlyLeaderCanDelete: '只有队长可以删除团队',
      onlyLeaderCanInvite: '只有队长可以邀请成员',
      onlyLeaderCanViewApplications: '只有团队领导可以查看申请',
      invitedUserNotFound: '被邀请用户不存在',
      alreadyTeamMember: '该用户已经是团队成员',
      userNotRegistered: '被邀请用户未参加该黑客松',
      alreadyInOtherTeam: '被邀请用户已加入其他团队',
      pendingInvitationExists: '该用户已有未处理的团队邀请',
      inviteError: '发送邀请失败',
      getApplicationsError: '获取申请列表失败',
      notTeamMember: '您不是该团队成员'
    },
    projects: {
      notFound: '项目不存在',
      createSuccess: '项目创建成功',
      createError: '创建项目失败',
      submitSuccess: '项目提交成功',
      submitError: '项目提交失败',
      updateSuccess: '项目更新成功',
      updateError: '项目更新失败',
      alreadySubmitted: '已经为该黑客松提交了项目',
      getListError: '获取项目列表失败',
      getDetailsError: '获取项目详情失败',
      deleteSuccess: '项目删除成功',
      deleteError: '删除项目失败',
      onlyTeamMemberCanModify: '只有项目团队成员可以修改项目信息',
      onlyLeaderCanDelete: '只有队长可以删除项目',
      hackathonNotStarted: '黑客松尚未开始，无法提交项目',
      hackathonEnded: '黑客松已结束，无法提交项目',
      hackathonStartsAt: '黑客松将于 {startTime} 开始',
      hackathonEndedAt: '黑客松已于 {endTime} 结束',
      alreadyLiked: '您已经点赞过该项目',
      likeSuccess: '点赞成功',
      likeError: '点赞失败',
      notLikedYet: '您还没有点赞该项目',
      unlikeSuccess: '取消点赞成功',
      unlikeError: '取消点赞失败'
    },
    community: {
      postNotFound: '帖子不存在',
      createPostSuccess: '帖子创建成功',
      createPostError: '创建帖子失败',
      likeSuccess: '点赞成功',
      unlikeSuccess: '取消点赞成功',
      bookmarkSuccess: '收藏成功',
      unbookmarkSuccess: '取消收藏成功'
    },
    notifications: {
      markReadSuccess: '标记已读',
      clearSuccess: '通知已清除',
      sendSuccess: '通知发送成功'
    },
    validation: {
      required: '此字段为必填项',
      invalidEmail: '邮箱格式不正确',
      passwordTooShort: '密码至少8个字符',
      invalidDate: '日期格式不正确',
      fileTooLarge: '文件大小超出限制',
      invalidFileType: '文件类型不支持'
    },
    errors: {
      serverError: '服务器内部错误',
      networkError: '网络连接错误',
      validationError: '数据验证失败',
      permissionDenied: '权限不足',
      rateLimitExceeded: '请求过于频繁，请稍后重试'
    }
  }
};

// 从请求头获取语言偏好
export function getLocaleFromRequest(request: Request): SupportedLocale {
  const acceptLanguage = request.headers.get('accept-language');
  const userAgent = request.headers.get('user-agent');
  
  // 优先从URL路径获取
  const url = new URL(request.url);
  const pathLocale = url.pathname.split('/')[1];
  if (pathLocale === 'zh' || pathLocale === 'en') {
    return pathLocale as SupportedLocale;
  }
  
  // 从Accept-Language头获取
  if (acceptLanguage) {
    if (acceptLanguage.includes('zh')) return 'zh';
    if (acceptLanguage.includes('en')) return 'en';
  }
  
  // 默认返回英文
  return 'en';
}

// 翻译函数
export function t(
  key: string, 
  locale: SupportedLocale = 'en',
  replacements?: Record<string, string>
): string {
  const keys = key.split('.');
  let value: any = messages[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 如果找不到翻译，尝试使用英文作为后备
      if (locale !== 'en') {
        return t(key, 'en', replacements);
      }
      return key; // 最后的后备方案
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // 处理占位符替换
  if (replacements) {
    let result = value;
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`{${placeholder}}`, 'g'), replacement);
    }
    return result;
  }
  
  return value;
}

// 创建带有特定语言环境的翻译函数
export function createTFunction(locale: SupportedLocale) {
  return (key: string, replacements?: Record<string, string>) => 
    t(key, locale, replacements);
}

// 在API路由中使用的示例：
/*
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const t = createTFunction(locale);
  
  try {
    // ... 业务逻辑
    
    return NextResponse.json({
      success: true,
      message: t('hackathons.createSuccess')
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: t('hackathons.createError')
    }, { status: 500 });
  }
}
*/
