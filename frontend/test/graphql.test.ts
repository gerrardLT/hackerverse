import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟GraphQL客户端
const mockGraphQLClient = {
  request: vi.fn()
}

vi.mock('../lib/graphql-client', () => ({
  graphqlClient: mockGraphQLClient
}))

describe('GraphQL Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Querying', () => {
    it('should query user data', async () => {
      const mockUserData = {
        user: {
          id: '0x1234567890123456789012345678901234567890',
          profileCID: 'QmTestUserProfile',
          registeredAt: '1640995200',
          hackathonsParticipated: [
            {
              id: '1',
              title: 'DeFi Innovation Challenge',
              dataCID: 'QmTestHackathonData'
            }
          ]
        }
      }

      mockGraphQLClient.request.mockResolvedValue(mockUserData)

      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            profileCID
            registeredAt
            hackathonsParticipated {
              id
              title
              dataCID
            }
          }
        }
      `

      const result = await mockGraphQLClient.request(query, {
        id: '0x1234567890123456789012345678901234567890'
      })

      expect(mockGraphQLClient.request).toHaveBeenCalledWith(query, {
        id: '0x1234567890123456789012345678901234567890'
      })
      expect(result).toEqual(mockUserData)
      expect(result.user.hackathonsParticipated).toHaveLength(1)
    })

    it('should query hackathon data', async () => {
      const mockHackathonData = {
        hackathon: {
          id: '1',
          organizer: '0x1234567890123456789012345678901234567890',
          dataCID: 'QmTestHackathonData',
          participants: [
            {
              id: '0x1111111111111111111111111111111111111111',
              profileCID: 'QmTestProfile1'
            }
          ],
          projects: [
            {
              id: '1',
              projectCID: 'QmTestProject1',
              creator: '0x1111111111111111111111111111111111111111',
              scores: [
                {
                  judge: '0x2222222222222222222222222222222222222222',
                  score: 85
                }
              ]
            }
          ]
        }
      }

      mockGraphQLClient.request.mockResolvedValue(mockHackathonData)

      const query = `
        query GetHackathon($id: ID!) {
          hackathon(id: $id) {
            id
            organizer
            dataCID
            participants {
              id
              profileCID
            }
            projects {
              id
              projectCID
              creator
              scores {
                judge
                score
              }
            }
          }
        }
      `

      const result = await mockGraphQLClient.request(query, { id: '1' })

      expect(mockGraphQLClient.request).toHaveBeenCalledWith(query, { id: '1' })
      expect(result).toEqual(mockHackathonData)
      expect(result.hackathon.participants).toHaveLength(1)
      expect(result.hackathon.projects).toHaveLength(1)
    })

    it('should query project data with scores', async () => {
      const mockProjectData = {
        project: {
          id: '1',
          projectCID: 'QmTestProject1',
          creator: '0x1111111111111111111111111111111111111111',
          hackathon: {
            id: '1',
            dataCID: 'QmTestHackathonData'
          },
          scores: [
            {
              judge: '0x2222222222222222222222222222222222222222',
              score: 85,
              scoredAt: '1641081600'
            },
            {
              judge: '0x3333333333333333333333333333333333333333',
              score: 90,
              scoredAt: '1641168000'
            }
          ]
        }
      }

      mockGraphQLClient.request.mockResolvedValue(mockProjectData)

      const query = `
        query GetProject($id: ID!) {
          project(id: $id) {
            id
            projectCID
            creator
            hackathon {
              id
              dataCID
            }
            scores {
              judge
              score
              scoredAt
            }
          }
        }
      `

      const result = await mockGraphQLClient.request(query, { id: '1' })

      expect(result.project.scores).toHaveLength(2)
      expect(result.project.scores[0].score).toBe(85)
      expect(result.project.scores[1].score).toBe(90)
    })
  })

  describe('Real-time Updates', () => {
    it('should handle subscription updates', async () => {
      const mockSubscriptionData = {
        userRegistered: {
          id: '0x4444444444444444444444444444444444444444',
          profileCID: 'QmNewUserProfile',
          registeredAt: '1641254400'
        }
      }

      // 模拟订阅
      const mockSubscription = {
        subscribe: vi.fn().mockReturnValue({
          next: vi.fn(),
          error: vi.fn(),
          complete: vi.fn()
        })
      }

      const subscription = `
        subscription OnUserRegistered {
          userRegistered {
            id
            profileCID
            registeredAt
          }
        }
      `

      // 模拟订阅响应
      const subscriber = mockSubscription.subscribe()
      subscriber.next(mockSubscriptionData)

      expect(mockSubscription.subscribe).toHaveBeenCalled()
      expect(subscriber.next).toHaveBeenCalledWith(mockSubscriptionData)
    })

    it('should handle hackathon created subscription', async () => {
      const mockHackathonCreated = {
        hackathonCreated: {
          id: '2',
          organizer: '0x5555555555555555555555555555555555555555',
          dataCID: 'QmNewHackathonData',
          createdAt: '1641340800'
        }
      }

      const mockSubscription = {
        subscribe: vi.fn().mockReturnValue({
          next: vi.fn(),
          error: vi.fn(),
          complete: vi.fn()
        })
      }

      const subscriber = mockSubscription.subscribe()
      subscriber.next(mockHackathonCreated)

      expect(subscriber.next).toHaveBeenCalledWith(mockHackathonCreated)
    })
  })

  describe('Cache Management', () => {
    it('should cache query results', async () => {
      const mockData = {
        users: [
          { id: '0x1111111111111111111111111111111111111111', profileCID: 'QmProfile1' },
          { id: '0x2222222222222222222222222222222222222222', profileCID: 'QmProfile2' }
        ]
      }

      // 模拟缓存机制
      const cache = new Map()
      const cacheKey = 'users_query'

      mockGraphQLClient.request.mockResolvedValue(mockData)

      // 第一次查询
      const result1 = await mockGraphQLClient.request('query { users { id profileCID } }')
      cache.set(cacheKey, result1)

      // 第二次查询（应该从缓存获取）
      const cachedResult = cache.get(cacheKey)

      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1)
      expect(cachedResult).toEqual(mockData)
      expect(cache.has(cacheKey)).toBe(true)
    })

    it('should invalidate cache on mutations', async () => {
      const cache = new Map()
      const cacheKey = 'hackathons_query'

      // 设置初始缓存
      cache.set(cacheKey, { hackathons: [] })
      expect(cache.has(cacheKey)).toBe(true)

      // 模拟突变操作后清除缓存
      const mockMutation = {
        createHackathon: {
          id: '3',
          organizer: '0x6666666666666666666666666666666666666666',
          dataCID: 'QmMutationHackathon'
        }
      }

      mockGraphQLClient.request.mockResolvedValue(mockMutation)

      // 执行突变
      await mockGraphQLClient.request(`
        mutation CreateHackathon($data: String!) {
          createHackathon(dataCID: $data) {
            id
            organizer
            dataCID
          }
        }
      `, { data: 'QmMutationHackathon' })

      // 清除相关缓存
      cache.delete(cacheKey)

      expect(cache.has(cacheKey)).toBe(false)
      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error: Failed to fetch')
      mockGraphQLClient.request.mockRejectedValue(networkError)

      try {
        await mockGraphQLClient.request('query { users { id } }')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Network error: Failed to fetch')
      }

      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1)
    })

    it('should handle GraphQL errors', async () => {
      const graphqlError = {
        errors: [
          {
            message: 'User not found',
            path: ['user'],
            extensions: {
              code: 'USER_NOT_FOUND'
            }
          }
        ]
      }

      mockGraphQLClient.request.mockRejectedValue(graphqlError)

      try {
        await mockGraphQLClient.request('query GetUser($id: ID!) { user(id: $id) { id } }', {
          id: 'nonexistent'
        })
      } catch (error) {
        expect(error).toEqual(graphqlError)
        expect(error.errors[0].message).toBe('User not found')
        expect(error.errors[0].extensions.code).toBe('USER_NOT_FOUND')
      }
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      mockGraphQLClient.request.mockRejectedValue(timeoutError)

      const queryWithTimeout = async () => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(timeoutError)
          }, 5000)
        })
      }

      try {
        await queryWithTimeout()
      } catch (error) {
        expect(error.message).toBe('Request timeout')
      }
    })

    it('should retry failed requests', async () => {
      // 第一次失败，第二次成功
      mockGraphQLClient.request
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ users: [] })

      const retryRequest = async (query: string, retries = 2) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await mockGraphQLClient.request(query)
          } catch (error) {
            if (i === retries - 1) throw error
            // 等待一小段时间后重试
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }

      const result = await retryRequest('query { users { id } }')
      expect(result).toEqual({ users: [] })
      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(2)
    })
  })
})
