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
      registrationTooLate: 'Registration deadline cannot be more than 24 hours after start time',
      getListError: 'Failed to get hackathon list',
      getDetailsError: 'Failed to get hackathon details',
      privateEvent: 'This hackathon is a private event',
      organizerNotFound: 'Organizer information not found',
      organizerCannotJoin: 'Organizer cannot join their own hackathon',
      dataPreparationFailed: 'Data preparation failed',
      smartContractUnavailable: 'Smart contract service unavailable, hackathon creation failed',
      ipfsUploadFailed: 'IPFS upload failed, unable to create hackathon',
      smartContractCallFailed: 'Smart contract call failed, hackathon creation failed',
      creatorCannotJoin: 'Creator cannot participate in their own hackathon',
      registrationNotStarted: 'Registration has not started yet',
      participantLimitReached: 'Participant limit reached',
      alreadyRegistered: 'You have already registered for this hackathon',
      notRegistered: 'You have not registered for this hackathon',
      hackathonStarted: 'Hackathon has started, cannot cancel registration'
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
      onlyLeaderCanReviewApplications: 'Only team leader can review applications',
      invitedUserNotFound: 'Invited user not found',
      applicationNotFound: 'Application not found',
      applicationAlreadyProcessed: 'Application has already been processed',
      invitationNotFoundOrProcessed: 'Invitation not found or already processed',
      cancelRegistrationFailed: 'Failed to cancel registration',
      leaveSuccess: 'Successfully left hackathon',
      applicationNotBelongToTeam: 'Application does not belong to this team',
      reviewApplicationFailed: 'Failed to review application',
      notPublicRecruiting: 'This team is not publicly recruiting',
      alreadyMember: 'You are already a member of this team',
      applicationPending: 'You have already submitted an application, please wait for review',
      applicationSubmitFailed: 'Failed to submit application',
      alreadyTeamMember: 'User is already a team member',
      userNotRegistered: 'Invited user has not registered for this hackathon',
      alreadyInOtherTeam: 'Invited user has already joined another team',
      pendingInvitationExists: 'User already has a pending team invitation',
      inviteError: 'Failed to send invitation',
      getApplicationsError: 'Failed to get applications list',
      notTeamMember: 'You are not a member of this team',
      invitationDataInvalid: 'Invitation data is invalid',
      acceptInvitationFailed: 'Failed to accept invitation',
      getInvitationsError: 'Failed to get invitations list'
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
      emailFormatError: 'Email format is incorrect',
      passwordRequired: 'Password cannot be empty',
      passwordMinLength: 'Password must be at least 6 characters',
      usernameMinLength: 'Username must be at least 2 characters',
      usernameMaxLength: 'Username cannot exceed 30 characters',
      walletAddressFormat: 'Wallet address format is incorrect',
      titleRequired: 'Title cannot be empty',
      descriptionMinLength: 'Description must be at least 10 characters',
      startDateFormat: 'Start date format is incorrect',
      endDateFormat: 'End date format is incorrect',
      registrationStartDateFormat: 'Registration start date format is incorrect',
      registrationDeadlineFormat: 'Registration deadline format is incorrect',
      maxParticipantsMin: 'Maximum participants must be at least 1',
      prizePoolNonNegative: 'Prize pool cannot be negative',
      categoriesRequired: 'At least one category must be selected',
      teamNameMinLength: 'Team name must be at least 2 characters',
      teamDescriptionMinLength: 'Team description must be at least 10 characters',
      hackathonIdRequired: 'Hackathon ID cannot be empty',
      maxMembersRange: 'Maximum members must be between 1-10',
      skillsRequired: 'At least one skill must be selected',
      bioMaxLength: 'Bio cannot exceed 500 characters',
      avatarUrlFormat: 'Avatar URL format is incorrect',
      skillsMaxCount: 'Maximum 20 skills allowed',
      skillNameMaxLength: 'Skill name cannot exceed 50 characters',
      skillNameRequired: 'Skill name cannot be empty',
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
      rateLimitExceeded: 'Too many requests, please try again later',
      unknownError: 'Unknown error occurred',
      missingParameter: 'Missing required parameter',
      invalidCredentials: 'Invalid email or password',
      emailAlreadyExists: 'Email already exists',
      usernameAlreadyExists: 'Username already exists',
      walletAlreadyBound: 'Wallet address already registered',
      unauthenticated: 'Not authenticated',
      userNotExists: 'User does not exist',
      unsupportedOperation: 'Unsupported operation',
      queryFailed: 'Query failed',
      dataPreparationFailed: 'Data preparation failed',
      getStatsError: 'Failed to get statistics data'
    },
    stats: {
      users: {
        label: 'Registered Developers',
        description: 'Developer community from around the world'
      },
      hackathons: {
        label: 'Hackathons Held',
        description: 'Successfully organized hackathon events'
      },
      projects: {
        label: 'Submitted Projects',
        description: 'Innovative projects and solutions'
      },
      countries: {
        label: 'Countries Covered',
        description: 'Global reach and influence'
      }
    },
    web3: {
      contractServiceUnavailable: 'Smart contract service unavailable, hackathon creation failed',
      contractInitializationFailed: 'Smart contract service initialization failed',
      contractCallFailed: 'Smart contract call failed, hackathon creation failed',
      contractQueryError: 'Smart contract query error',
      userRegistrationSuccess: 'User registration successful',
      hackathonCreationSuccess: 'Hackathon created successfully',
      missingProfileCID: 'Missing profileCID parameter',
      missingHackathonCID: 'Missing hackathonCID parameter'
    },
    ipfs: {
      uploadFailed: 'IPFS upload failed, cannot create user',
      uploadFailedHackathon: 'IPFS upload failed, cannot create hackathon',
      uploadTimeout: 'IPFS upload timeout',
      uploadSuccess: 'IPFS upload successful',
      networkTimeout: 'IPFS network timeout, please check network connection and retry',
      gatewayUnavailable: 'IPFS gateway service temporarily unavailable, please try again later',
      networkConnectionFailed: 'IPFS network connection failed, please check network settings',
      startingUpload: 'Starting IPFS upload user profile...',
      uploadError: 'IPFS upload error',
      dataUploadSuccess: 'IPFS hackathon data upload successful',
      dataPreparationComplete: 'Hackathon data preparation complete, preparing to verify smart contract'
    },
    notificationTemplates: {
      teamInvite: 'Team Invitation',
      teamInviteMessage: '{inviterName} invites you to join team "{teamName}"',
      viewDetails: 'View Details',
      applicationApproved: 'Application Approved',
      applicationRejected: 'Application Rejected',
      applicationApprovedMessage: 'Congratulations! Your application to join team "{teamName}" has been approved',
      applicationRejectedMessage: 'Sorry, your application to join team "{teamName}" has been rejected',
      viewTeam: 'View Team',
      newMemberJoined: 'New Member Joined',
      newMemberJoinedMessage: '{memberName} has joined your team "{teamName}"',
      postReply: 'Someone replied to your post',
      postReplyMessage: 'A user replied to your post "{postTitle}"',
      postLiked: 'Someone liked your post',
      postLikedMessage: 'A user liked your post "{postTitle}"',
      replyLiked: 'Someone liked your reply',
      replyLikedMessage: 'A user liked your reply in "{postTitle}"',
      newFollower: 'New follower',
      newFollowerMessage: '{followerName} followed you'
    },
    dashboard: {
      getUserStatsError: 'Failed to get user statistics',
      getAchievementsError: 'Failed to get user achievements',
      getActivityError: 'Failed to get user activity',
      getReputationError: 'Failed to get reputation data',
      createAchievementError: 'Failed to create achievement',
      updateAchievementError: 'Failed to update achievement',
      achievementCreatedSuccess: 'Achievement created successfully',
      achievementUpdatedSuccess: 'Achievement updated successfully',
      invalidAchievementData: 'Invalid achievement data',
      userNotFound: 'User not found',
      invalidRequest: 'Invalid request parameters'
    },
    admin: {
      dashboard: {
        loadError: 'Failed to load admin dashboard data'
      },
      content: {
        loadError: 'Failed to get pending content reviews',
        modelNotAvailable: 'Content review model not available',
        notFound: 'Review content not found',
        alreadyReviewed: 'Content has already been reviewed',
        approveSuccess: 'Content approved successfully',
        rejectSuccess: 'Content rejected successfully',
        flagSuccess: 'Content flagged successfully',
        reviewError: 'Content review operation failed'
      },
      analytics: {
        loadError: 'Failed to get analytics data',
        overview: {
          title: 'Analytics Overview',
          description: 'Comprehensive analytics dashboard for organizers',
          participants: 'Participants',
          projects: 'Projects', 
          teams: 'Teams',
          avgProjectsPerTeam: 'Avg Projects per Team',
          completionRate: 'Completion Rate',
          satisfactionScore: 'Satisfaction Score'
        },
        participation: {
          title: 'Participation Analysis',
          description: 'Detailed participation metrics and trends',
          registrations: 'Registrations',
          actualParticipants: 'Actual Participants',
          dropoutRate: 'Dropout Rate',
          dailyRegistrations: 'Daily Registrations',
          peakRegistrationTime: 'Peak Registration Time',
          averageTeamSize: 'Average Team Size'
        },
        projects: {
          title: 'Project Quality Analysis',
          description: 'Project submission and quality metrics',
          totalSubmissions: 'Total Submissions',
          submissionRate: 'Submission Rate',
          averageScore: 'Average Score',
          topProjects: 'Top Projects',
          technologyDistribution: 'Technology Distribution',
          categoryBreakdown: 'Category Breakdown'
        },
        teams: {
          title: 'Team Collaboration Analysis',
          description: 'Team formation and collaboration patterns',
          averageFormationTime: 'Average Formation Time',
          soloParticipants: 'Solo Participants',
          teamSizeDistribution: 'Team Size Distribution',
          collaborationScore: 'Collaboration Score',
          communicationActivity: 'Communication Activity'
        },
        report: {
          title: 'Custom Reports',
          description: 'Create and manage custom analytics reports',
          name: 'Report Name',
          reportType: 'Report Type',
          scope: 'Scope',
          create: 'Create Report',
          generate: 'Generate Report',
          export: 'Export Report',
          lastGenerated: 'Last Generated',
          notFound: 'Report not found',
          createSuccess: 'Report created successfully',
          createError: 'Failed to create report',
          generateSuccess: 'Report generated successfully',
          generateError: 'Failed to generate report',
          deleteSuccess: 'Report deleted successfully',
          deleteError: 'Failed to delete report'
        },
        export: {
          title: 'Export Data',
          format: 'Export Format',
          json: 'JSON',
          csv: 'CSV',
          excel: 'Excel',
          pdf: 'PDF',
          exportSuccess: 'Data exported successfully',
          exportError: 'Failed to export data',
          unsupportedFormat: 'Unsupported export format',
          pdfNotSupported: 'PDF export is not supported yet'
        },
        errors: {
          dataLoadFailed: 'Failed to load analytics data',
          reportNotFound: 'Report not found',
          insufficientPermissions: 'Insufficient permissions to access analytics',
          invalidTimeRange: 'Invalid time range specified',
          noDataAvailable: 'No data available for the selected period'
        }
      },
      hackathons: {
        loadError: 'Failed to load hackathons for review',
        notFound: 'Hackathon not found',
        cannotReview: 'Hackathon cannot be reviewed in current status',
        submitSuccess: 'Hackathon submitted for review',
        approveSuccess: 'Hackathon approved successfully',
        rejectSuccess: 'Hackathon rejected successfully',
        request_changesSuccess: 'Change request sent successfully',
        reviewError: 'Hackathon review operation failed',
        historyError: 'Failed to load review history'
      }
    },
    credentials: {
      generate: {
        forbidden: 'You do not have permission to generate credentials for other users',
        success: 'Credential generated successfully',
        error: 'Failed to generate credential'
      },
      verify: {
        invalidHash: 'Invalid IPFS hash format',
        error: 'Failed to verify credential'
      },
      upload: {
        forbidden: 'You do not have permission to upload this credential',
        alreadyExists: 'Credential already exists',
        success: 'Credential uploaded successfully',
        error: 'Failed to upload credential',
        getInfo: 'IPFS credential upload service',
        infoError: 'Failed to get upload information'
      },
      templates: {
        loadError: 'Failed to load credential templates',
        createForbidden: 'You do not have permission to create templates',
        nameExists: 'Template name already exists for this credential type',
        invalidSchema: 'Invalid JSON schema format',
        createSuccess: 'Template created successfully',
        createError: 'Failed to create template'
      },
      subjectNotFound: 'Subject user not found',
      issuerNotFound: 'Issuer user not found',
      templateNotFound: 'Template not found',
      insufficientRole: 'Insufficient role to use this template'
    },
    reputation: {
      userNotFound: 'User not found',
      userInactive: 'User is inactive',
      fetchError: 'Failed to fetch user reputation information',
      leaderboard: {
        error: 'Failed to fetch leaderboard'
      },
      unauthorizedCalculate: 'Unauthorized to perform reputation calculation',
      invalidCalculateParams: 'Invalid parameters',
      calculateAllSuccess: 'All users reputation scores recalculated successfully',
      calculateUserSuccess: 'User reputation score recalculated successfully',
      calculateError: 'Failed to calculate reputation scores',
      rules: {
        fetchError: 'Failed to fetch reputation rules',
        missingFields: 'Missing required fields',
        actionExists: 'Action type already exists',
        createSuccess: 'Reputation rule created successfully',
        createError: 'Failed to create reputation rule',
        missingId: 'Missing rule ID',
        notFound: 'Rule not found',
        updateSuccess: 'Reputation rule updated successfully',
        updateError: 'Failed to update reputation rule',
        deactivateSuccess: 'Rule deactivated (due to existing records)',
        deleteSuccess: 'Reputation rule deleted successfully',
        deleteError: 'Failed to delete reputation rule'
      }
    },
    judging: {
      assignments: {
        fetchError: 'Failed to fetch judge assignments'
      },
      score: {
        notAssigned: 'You are not assigned to judge this hackathon',
        projectNotFound: 'Project not found',
        hackathonNotActive: 'This hackathon is not currently accepting scores',
        missingRequiredCriteria: 'Missing required criteria: {criterion}',
        invalidData: 'Invalid score data',
        draftSaved: 'Draft saved successfully',
        submitted: 'Score submitted successfully',
        submitError: 'Failed to submit score'
      },
      criteria: {
        hackathonNotFound: 'Hackathon not found',
        fetchError: 'Failed to fetch scoring criteria',
        hackathonIdRequired: 'Hackathon ID is required',
        criteriaIdRequired: 'Criteria ID is required',
        notFound: 'Criteria not found',
        invalidData: 'Invalid criteria data',
        invalidScoreRange: 'Minimum score must be less than maximum score',
        weightExceeds100: 'Total weight cannot exceed 100%',
        weightWouldExceed100: 'Adding this criteria would exceed 100% total weight',
        createSuccess: 'Scoring criteria created successfully',
        createError: 'Failed to create scoring criteria',
        updateSuccess: 'Scoring criteria updated successfully',
        updateError: 'Failed to update scoring criteria',
        deleteSuccess: 'Scoring criteria deleted successfully',
        deleteError: 'Failed to delete scoring criteria',
        deactivateSuccess: 'Scoring criteria deactivated successfully',
        batchCreateSuccess: 'Scoring criteria batch created successfully'
      },
      results: {
        hackathonNotFound: 'Hackathon not found',
        fetchError: 'Failed to fetch judging results'
      }
    },
    teamMatching: {
      preferences: {
        hackathonIdRequired: 'Hackathon ID is required',
        idRequired: 'Team ID or User ID is required',
        unauthorizedTeam: 'You are not authorized to access this team',
        fetchError: 'Failed to fetch team preferences',
        updateSuccess: 'Team preferences updated successfully',
        updateError: 'Failed to update team preferences'
      },
      recommendations: {
        missingParams: 'Missing required parameters',
        unauthorizedTeam: 'You are not authorized to access this team',
        invalidType: 'Invalid recommendation type',
        fetchError: 'Failed to fetch team recommendations'
      },
      compatibility: {
        hackathonIdRequired: 'Hackathon ID is required',
        calculateError: 'Failed to calculate compatibility'
      },
      joinRequest: {
        alreadyMember: 'You are already a member of this team',
        alreadyApplied: 'You have already applied to this team',
        teamNotFound: 'Team not found',
        submitSuccess: 'Join request submitted successfully',
        submitError: 'Failed to submit join request'
      },
      suitable: {
        alreadyInTeam: 'You are already a member of a team in this hackathon',
        fetchError: 'Failed to fetch suitable teams'
      },
      matching: {
        pageTitle: 'Smart Team Matching',
        pageDescription: 'Find the perfect team or teammates with AI-powered recommendations',
        preferencesTitle: 'Matching Preferences',
        preferencesDescription: 'Set your team matching preferences, the system will recommend the most suitable teams based on these conditions',
        skillMatching: 'Skill Matching',
        requiredSkills: 'Required Skills',
        preferredSkills: 'Preferred Skills',
        skillWeight: 'Skill Match Weight',
        experienceRequirements: 'Experience Requirements',
        minExperience: 'Minimum Experience',
        maxExperience: 'Maximum Experience',
        teamSize: 'Team Size',
        preferredTeamSize: 'Preferred Team Size',
        maxTeamSize: 'Maximum Team Size',
        collaborationPreferences: 'Collaboration Preferences',
        collaborationStyle: 'Collaboration Style',
        diversityPreference: 'Diversity Preference',
        advancedSettings: 'Advanced Settings',
        locationFlexible: 'Location Flexible',
        personalityMatch: 'Consider Personality Match',
        enableNotifications: 'Enable Match Notifications',
        autoAcceptThreshold: 'Auto Accept Threshold',
        aiRecommendations: 'AI Recommendations',
        suitableTeams: 'Suitable Teams',
        noMatches: 'No Matching Teams',
        noMatchesDescription: 'Try adjusting your matching preferences or check other suitable teams',
        adjustPreferences: 'Adjust Preferences',
        noSuitableTeams: 'No Suitable Teams',
        noSuitableTeamsDescription: 'No teams found matching your criteria, please try again later',
        matchingTeams: 'Finding the most suitable teams for you...',
        refreshRecommendations: 'Refresh Recommendations',
        matchingSettings: 'Matching Settings',
        filterConditions: 'Filter Conditions',
        selectHackathon: 'Select Hackathon',
        allHackathons: 'All Hackathons',
        compatibility: 'Compatibility',
        matchingSkills: 'Matching Skills',
        members: 'members',
        slots: 'slots',
        viewDetails: 'View Details',
        applyToJoin: 'Apply to Join',
        recruiting: 'Recruiting',
        highMatch: 'High Match',
        goodMatch: 'Good Match',
        averageMatch: 'Average Match',
        lowMatch: 'Low Match',
        saveSettings: 'Save Settings',
        cancel: 'Cancel',
        applicationSubmitted: 'Application Submitted',
        applicationSubmittedDesc: 'Your application has been sent to team',
        settingsSaved: 'Settings Saved',
        settingsSavedDesc: 'Your matching preferences have been updated, the system will recommend teams based on new settings',
        loadingFailed: 'Loading Failed',
        loadingFailedDesc: 'Unable to load team recommendations, please try again later',
        loginRequired: 'Login Required',
        loginRequiredDesc: 'You need to login before applying to join a team'
      }
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
      registrationTooLate: '注册截止时间不能超过开始时间后24小时',
      getListError: '获取黑客松列表失败',
      getDetailsError: '获取黑客松详情失败',
      privateEvent: '该黑客松为私有活动',
      organizerNotFound: '组织者信息不存在',
      organizerCannotJoin: '创建者不能参加自己创建的黑客松',
      dataPreparationFailed: '数据准备失败',
      smartContractUnavailable: '智能合约服务不可用，黑客松创建失败',
      ipfsUploadFailed: 'IPFS上传失败，无法创建黑客松',
      smartContractCallFailed: '智能合约调用失败，黑客松创建失败',
      creatorCannotJoin: '创建者不能参加自己创建的黑客松',
      registrationNotStarted: '报名尚未开始',
      participantLimitReached: '参与人数已达上限',
      alreadyRegistered: '您已经报名参加该黑客松',
      notRegistered: '您未报名参加该黑客松',
      hackathonStarted: '黑客松已开始，无法取消报名'
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
      onlyLeaderCanReviewApplications: '只有团队领导可以审批申请',
      invitedUserNotFound: '被邀请用户不存在',
      applicationNotFound: '申请不存在',
      applicationAlreadyProcessed: '申请已被处理',
      invitationNotFoundOrProcessed: '邀请不存在或已处理',
      cancelRegistrationFailed: '取消参加失败',
      leaveSuccess: '取消参加成功',
      applicationNotBelongToTeam: '申请不属于该团队',
      reviewApplicationFailed: '审批申请失败',
      notPublicRecruiting: '该团队不公开招募',
      alreadyMember: '您已经是该团队成员',
      applicationPending: '您已提交申请，请等待审核',
      applicationSubmitFailed: '申请提交失败',
      alreadyTeamMember: '该用户已经是团队成员',
      userNotRegistered: '被邀请用户未参加该黑客松',
      alreadyInOtherTeam: '被邀请用户已加入其他团队',
      pendingInvitationExists: '该用户已有未处理的团队邀请',
      inviteError: '发送邀请失败',
      getApplicationsError: '获取申请列表失败',
      notTeamMember: '您不是该团队成员',
      invitationDataInvalid: '邀请数据无效',
      acceptInvitationFailed: '接受邀请失败',
      getInvitationsError: '获取邀请列表失败'
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
      emailFormatError: '邮箱格式不正确',
      passwordRequired: '密码不能为空',
      passwordMinLength: '密码至少6位',
      usernameMinLength: '用户名至少2个字符',
      usernameMaxLength: '用户名最多30个字符',
      walletAddressFormat: '钱包地址格式不正确',
      titleRequired: '标题不能为空',
      descriptionMinLength: '描述至少10个字符',
      startDateFormat: '开始日期格式不正确',
      endDateFormat: '结束日期格式不正确',
      registrationStartDateFormat: '报名开始日期格式不正确',
      registrationDeadlineFormat: '注册截止日期格式不正确',
      maxParticipantsMin: '最大参与人数至少1人',
      prizePoolNonNegative: '奖金池不能为负数',
      categoriesRequired: '至少选择一个类别',
      teamNameMinLength: '团队名称至少2个字符',
      teamDescriptionMinLength: '团队描述至少10个字符',
      hackathonIdRequired: '黑客松ID不能为空',
      maxMembersRange: '最大成员数至少1人且不能超过10人',
      skillsRequired: '至少选择一种技能',
      bioMaxLength: '个人简介最多500个字符',
      avatarUrlFormat: '头像链接格式不正确',
      skillsMaxCount: '最多添加20个技能',
      skillNameMaxLength: '技能名称最多50个字符',
      skillNameRequired: '技能名称不能为空',
      passwordTooShort: '密码至少8个字符',
      invalidDate: '日期格式不正确',
      fileTooLarge: '文件大小超出限制',
      invalidFileType: '文件类型不支持',
      projectTitleRequired: '项目标题不能为空',
      projectDescriptionMinLength: '项目描述至少10个字符',
      technologiesRequired: '至少选择一种技术',
      githubUrlFormat: 'GitHub链接格式不正确',
      demoUrlFormat: '演示链接格式不正确',
      videoUrlFormat: '视频链接格式不正确',
      presentationUrlFormat: '演示文稿链接格式不正确',
      userIdRequired: '用户ID不能为空',
      messageMaxLength: '消息不能超过{max}个字符',
      inviteMessageMaxLength: '邀请消息不能超过500字符'
    },
    errors: {
      serverError: '服务器内部错误',
      networkError: '网络连接错误',
      validationError: '数据验证失败',
      permissionDenied: '权限不足',
      rateLimitExceeded: '请求过于频繁，请稍后重试',
      unknownError: '未知错误',
      missingParameter: '缺少必要参数',
      invalidCredentials: '邮箱或密码错误',
      emailAlreadyExists: '邮箱已被注册',
      usernameAlreadyExists: '用户名已被使用',
      walletAlreadyBound: '钱包地址已被绑定',
      unauthenticated: '未认证',
      userNotExists: '用户不存在',
      unsupportedOperation: '不支持的操作',
      queryFailed: '查询失败',
      dataPreparationFailed: '数据准备失败',
      getStatsError: '获取统计数据失败',
      operationFailed: '操作失败',
      validationFailed: '验证失败',
      requestDataValidationFailed: '请求数据验证失败',
      insufficientPermissions: '权限不足',
      adminRequired: '需要管理员权限'
    },
    stats: {
      users: {
        label: '注册开发者',
        description: '来自全球的开发者社区'
      },
      hackathons: {
        label: '举办黑客松',
        description: '成功举办的黑客松活动'
      },
      projects: {
        label: '提交项目',
        description: '创新项目和解决方案'
      },
      countries: {
        label: '覆盖国家',
        description: '全球范围的影响力'
      }
    },
    web3: {
      contractServiceUnavailable: '智能合约服务不可用，黑客松创建失败',
      contractInitializationFailed: '智能合约服务初始化失败',
      contractCallFailed: '智能合约调用失败，黑客松创建失败',
      contractQueryError: '智能合约查询错误',
      userRegistrationSuccess: '用户注册成功',
      hackathonCreationSuccess: '黑客松创建成功',
      missingProfileCID: '缺少profileCID',
      missingHackathonCID: '缺少hackathonCID'
    },
    ipfs: {
      uploadFailed: 'IPFS上传失败，无法创建用户',
      uploadFailedHackathon: 'IPFS上传失败，无法创建黑客松',
      uploadTimeout: 'IPFS上传超时',
      uploadSuccess: 'IPFS上传成功',
      networkTimeout: 'IPFS网络响应超时，请检查网络连接后重试',
      gatewayUnavailable: 'IPFS网关服务暂时不可用，请稍后重试',
      networkConnectionFailed: 'IPFS网络连接失败，请检查网络设置',
      startingUpload: '开始IPFS上传用户资料',
      uploadError: 'IPFS上传失败',
      dataUploadSuccess: 'IPFS黑客松数据上传成功',
      dataPreparationComplete: '黑客松数据准备完成，准备验证智能合约'
    },
    notificationTemplates: {
      teamInvite: '团队邀请',
      teamInviteMessage: '{inviterName} 邀请你加入 "{teamName}" 团队',
      viewDetails: '查看详情',
      applicationApproved: '申请已批准',
      applicationRejected: '申请被拒绝',
      applicationApprovedMessage: '恭喜！你的加入 "{teamName}" 团队的申请已被批准',
      applicationRejectedMessage: '很遗憾，你的加入 "{teamName}" 团队的申请被拒绝',
      viewTeam: '查看团队',
      newMemberJoined: '新成员加入',
      newMemberJoinedMessage: '{memberName} 已加入你的团队 "{teamName}"',
      postReply: '有人回复了你的帖子',
      postReplyMessage: '有用户回复了你的帖子《{postTitle}》',
      postLiked: '有人点赞了你的帖子',
      postLikedMessage: '有用户点赞了你的帖子《{postTitle}》',
      replyLiked: '有人点赞了你的回复',
      replyLikedMessage: '有用户点赞了你在《{postTitle}》下的回复',
      newFollower: '有新的粉丝关注了你',
      newFollowerMessage: '{followerName} 关注了你'
    },
    dashboard: {
      getUserStatsError: '获取用户统计数据失败',
      getAchievementsError: '获取用户成就失败',
      getActivityError: '获取用户活动失败',
      getReputationError: '获取声誉数据失败',
      createAchievementError: '创建成就失败',
      updateAchievementError: '更新成就失败',
      achievementCreatedSuccess: '成就创建成功',
      achievementUpdatedSuccess: '成就更新成功',
      invalidAchievementData: '成就数据无效',
      userNotFound: '用户不存在',
      invalidRequest: '请求参数无效'
    },
    admin: {
      dashboard: {
        loadError: '加载管理员仪表板数据失败'
      },
      content: {
        loadError: '获取待审核内容失败',
        modelNotAvailable: '内容审核模型不可用',
        notFound: '审核内容不存在',
        alreadyReviewed: '内容已经审核过',
        approveSuccess: '内容审核通过',
        rejectSuccess: '内容已拒绝',
        flagSuccess: '内容已标记',
        reviewError: '内容审核操作失败'
      },
      analytics: {
        loadError: '获取分析数据失败',
        overview: {
          title: '分析概览',
          description: '为组织者提供的综合分析仪表板',
          participants: '参与者',
          projects: '项目',
          teams: '团队',
          avgProjectsPerTeam: '平均每团队项目数',
          completionRate: '完成率',
          satisfactionScore: '满意度评分'
        },
        participation: {
          title: '参与度分析',
          description: '详细的参与指标和趋势',
          registrations: '报名人数',
          actualParticipants: '实际参与者',
          dropoutRate: '流失率',
          dailyRegistrations: '每日报名',
          peakRegistrationTime: '报名高峰时间',
          averageTeamSize: '平均团队规模'
        },
        projects: {
          title: '项目质量分析',
          description: '项目提交和质量指标',
          totalSubmissions: '总提交数',
          submissionRate: '提交率',
          averageScore: '平均分数',
          topProjects: '顶级项目',
          technologyDistribution: '技术分布',
          categoryBreakdown: '分类明细'
        },
        teams: {
          title: '团队协作分析',
          description: '团队组建和协作模式',
          averageFormationTime: '平均组队时间',
          soloParticipants: '单人参与者',
          teamSizeDistribution: '团队规模分布',
          collaborationScore: '协作评分',
          communicationActivity: '沟通活跃度'
        },
        report: {
          title: '自定义报告',
          description: '创建和管理自定义分析报告',
          name: '报告名称',
          reportType: '报告类型',
          scope: '范围',
          create: '创建报告',
          generate: '生成报告',
          export: '导出报告',
          lastGenerated: '最后生成时间',
          notFound: '报告未找到',
          createSuccess: '报告创建成功',
          createError: '报告创建失败',
          generateSuccess: '报告生成成功',
          generateError: '报告生成失败',
          deleteSuccess: '报告删除成功',
          deleteError: '报告删除失败'
        },
        export: {
          title: '导出数据',
          format: '导出格式',
          json: 'JSON',
          csv: 'CSV',
          excel: 'Excel',
          pdf: 'PDF',
          exportSuccess: '数据导出成功',
          exportError: '数据导出失败',
          unsupportedFormat: '不支持的导出格式',
          pdfNotSupported: 'PDF导出暂不支持'
        },
        errors: {
          dataLoadFailed: '分析数据加载失败',
          reportNotFound: '报告未找到',
          insufficientPermissions: '权限不足，无法访问分析功能',
          invalidTimeRange: '指定的时间范围无效',
          noDataAvailable: '所选时期没有可用数据'
        }
      },
      hackathons: {
        loadError: '获取待审核黑客松失败',
        notFound: '黑客松不存在',
        cannotReview: '黑客松当前状态无法审核',
        submitSuccess: '黑客松已提交审核',
        approveSuccess: '黑客松审核通过',
        rejectSuccess: '黑客松已拒绝',
        request_changesSuccess: '修改请求已发送',
        reviewError: '黑客松审核操作失败',
        historyError: '获取审核历史失败'
      }
    },
    credentials: {
      generate: {
        forbidden: '您没有权限为其他用户生成凭证',
        success: '凭证生成成功',
        error: '凭证生成失败'
      },
      verify: {
        invalidHash: '无效的IPFS哈希格式',
        error: '凭证验证失败'
      },
      upload: {
        forbidden: '您没有权限上传此凭证',
        alreadyExists: '凭证已存在',
        success: '凭证上传成功',
        error: '凭证上传失败',
        getInfo: 'IPFS凭证上传服务',
        infoError: '获取上传信息失败'
      },
      templates: {
        loadError: '获取凭证模板失败',
        createForbidden: '您没有权限创建模板',
        nameExists: '该凭证类型的模板名称已存在',
        invalidSchema: '无效的JSON模式格式',
        createSuccess: '模板创建成功',
        createError: '模板创建失败'
      },
      subjectNotFound: '凭证主体用户不存在',
      issuerNotFound: '凭证颁发者不存在',
      templateNotFound: '模板不存在',
      insufficientRole: '角色权限不足，无法使用此模板'
    },
    reputation: {
      userNotFound: '用户不存在',
      userInactive: '用户已停用',
      fetchError: '获取用户声誉信息失败',
      leaderboard: {
        error: '获取排行榜失败'
      },
      unauthorizedCalculate: '无权限执行声誉计算',
      invalidCalculateParams: '参数无效',
      calculateAllSuccess: '所有用户声誉积分重新计算完成',
      calculateUserSuccess: '用户声誉积分重新计算完成',
      calculateError: '声誉积分计算失败',
      rules: {
        fetchError: '获取声誉规则失败',
        missingFields: '缺少必填字段',
        actionExists: '该行为类型已存在',
        createSuccess: '声誉规则创建成功',
        createError: '创建声誉规则失败',
        missingId: '缺少规则ID',
        notFound: '规则不存在',
        updateSuccess: '声誉规则更新成功',
        updateError: '更新声誉规则失败',
        deactivateSuccess: '规则已停用（因为存在相关记录）',
        deleteSuccess: '声誉规则删除成功',
        deleteError: '删除声誉规则失败'
      }
    },
    judging: {
      assignments: {
        fetchError: '获取评委分配失败'
      },
      score: {
        notAssigned: '您没有被分配评审此黑客松',
        projectNotFound: '项目不存在',
        hackathonNotActive: '此黑客松目前不接受评分',
        missingRequiredCriteria: '缺少必填评分项：{criterion}',
        invalidData: '评分数据无效',
        draftSaved: '草稿保存成功',
        submitted: '评分提交成功',
        submitError: '提交评分失败'
      },
      criteria: {
        hackathonNotFound: '黑客松不存在',
        fetchError: '获取评分标准失败',
        hackathonIdRequired: '需要黑客松ID',
        criteriaIdRequired: '需要标准ID',
        notFound: '评分标准不存在',
        invalidData: '评分标准数据无效',
        invalidScoreRange: '最小分数必须小于最大分数',
        weightExceeds100: '总权重不能超过100%',
        weightWouldExceed100: '添加此标准会导致总权重超过100%',
        createSuccess: '评分标准创建成功',
        createError: '创建评分标准失败',
        updateSuccess: '评分标准更新成功',
        updateError: '更新评分标准失败',
        deleteSuccess: '评分标准删除成功',
        deleteError: '删除评分标准失败',
        deactivateSuccess: '评分标准停用成功',
        batchCreateSuccess: '评分标准批量创建成功'
      },
      results: {
        hackathonNotFound: '黑客松不存在',
        fetchError: '获取评审结果失败'
      }
    },
    teamMatching: {
      preferences: {
        hackathonIdRequired: '需要黑客松ID',
        idRequired: '需要团队ID或用户ID',
        unauthorizedTeam: '您无权访问此团队',
        fetchError: '获取团队偏好失败',
        updateSuccess: '团队偏好更新成功',
        updateError: '更新团队偏好失败'
      },
      recommendations: {
        missingParams: '缺少必要参数',
        unauthorizedTeam: '您无权访问此团队',
        invalidType: '无效的推荐类型',
        fetchError: '获取团队推荐失败'
      },
      compatibility: {
        hackathonIdRequired: '需要黑客松ID',
        calculateError: '计算兼容性失败'
      },
      joinRequest: {
        alreadyMember: '您已经是此团队的成员',
        alreadyApplied: '您已经申请加入此团队',
        teamNotFound: '团队不存在',
        submitSuccess: '加入请求提交成功',
        submitError: '提交加入请求失败'
      },
      suitable: {
        alreadyInTeam: '您已经是此黑客松中某个团队的成员',
        fetchError: '获取适合的团队失败'
      },
      matching: {
        pageTitle: '智能团队匹配',
        pageDescription: '基于AI算法为您推荐最合适的团队和队友',
        preferencesTitle: '匹配偏好设置',
        preferencesDescription: '设置您的团队匹配偏好，系统将根据这些条件为您推荐最合适的团队',
        skillMatching: '技能匹配',
        requiredSkills: '必需技能',
        preferredSkills: '偏好技能',
        skillWeight: '技能匹配权重',
        experienceRequirements: '经验要求',
        minExperience: '最低经验',
        maxExperience: '最高经验',
        teamSize: '团队规模',
        preferredTeamSize: '偏好团队规模',
        maxTeamSize: '最大团队规模',
        collaborationPreferences: '协作偏好',
        collaborationStyle: '协作风格',
        diversityPreference: '多样性偏好',
        advancedSettings: '高级设置',
        locationFlexible: '地理位置灵活',
        personalityMatch: '考虑性格匹配',
        enableNotifications: '启用匹配通知',
        autoAcceptThreshold: '自动接受阈值',
        aiRecommendations: 'AI推荐',
        suitableTeams: '适合团队',
        noMatches: '暂无匹配的团队',
        noMatchesDescription: '尝试调整您的匹配偏好或查看其他适合的团队',
        adjustPreferences: '调整偏好',
        noSuitableTeams: '暂无适合的团队',
        noSuitableTeamsDescription: '当前没有找到符合条件的团队，请稍后再试',
        matchingTeams: '正在为您匹配最合适的团队...',
        refreshRecommendations: '刷新推荐',
        matchingSettings: '匹配设置',
        filterConditions: '筛选条件',
        selectHackathon: '选择黑客松',
        allHackathons: '所有黑客松',
        compatibility: '匹配度',
        matchingSkills: '匹配技能',
        members: '成员',
        slots: '空位',
        viewDetails: '查看详情',
        applyToJoin: '申请加入',
        recruiting: '招募中',
        highMatch: '高度匹配',
        goodMatch: '良好匹配',
        averageMatch: '一般匹配',
        lowMatch: '匹配度低',
        saveSettings: '保存设置',
        cancel: '取消',
        applicationSubmitted: '申请已提交',
        applicationSubmittedDesc: '您的加入申请已发送给团队',
        settingsSaved: '设置已保存',
        settingsSavedDesc: '您的匹配偏好已更新，系统将根据新设置为您推荐团队',
        loadingFailed: '加载失败',
        loadingFailedDesc: '无法加载团队推荐，请稍后重试',
        loginRequired: '请先登录',
        loginRequiredDesc: '您需要登录后才能申请加入团队'
      }
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
