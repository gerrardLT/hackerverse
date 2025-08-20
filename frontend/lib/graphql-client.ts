// GraphQL客户端配置
export const GRAPH_ENDPOINT = process.env.NEXT_PUBLIC_GRAPH_ENDPOINT || 'https://api.thegraph.com/subgraphs/name/hackx-platform'

// GraphQL查询定义
export const QUERIES = {
  GET_USER: `
    query GetUser($address: String!) {
      user(id: $address) {
        id
        address
        profileCID
        profileData {
          username
          email
          avatar
          bio
          skills
          socialLinks {
            platform
            url
          }
        }
        hackathons {
          hackathon {
            hackathonId
            dataCID
            hackathonData {
              title
              description
              startDate
              endDate
              status
            }
          }
        }
        projects {
          projectId
          dataCID
          projectData {
            title
            description
            demoUrl
            githubUrl
            techStack
          }
        }
      }
    }
  `,

  GET_HACKATHONS: `
    query GetHackathons($first: Int, $skip: Int) {
      hackathons(
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        hackathonId
        organizer {
          address
          profileData {
            username
            avatar
          }
        }
        dataCID
        hackathonData {
          title
          description
          startDate
          endDate
          prizePool
          categories
          status
        }
        participants {
          user {
            address
            profileData {
              username
            }
          }
        }
        projects {
          projectId
          creator {
            address
          }
        }
      }
    }
  `,

  GET_PROJECTS: `
    query GetProjects($first: Int, $skip: Int) {
      projects(
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        projectId
        creator {
          address
          profileData {
            username
          }
        }
        hackathon {
          hackathonId
          hackathonData {
            title
          }
        }
        dataCID
        projectData {
          title
          description
          demoUrl
          githubUrl
          techStack
        }
        scores {
          score
          submittedAt
        }
      }
    }
  `
}

// GraphQL服务类
export class GraphQLService {
  static async query(query: string, variables: any = {}) {
    try {
      const response = await fetch(GRAPH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0].message)
      }

      return data.data
    } catch (error) {
      console.error('GraphQL查询失败:', error)
      throw error
    }
  }

  // 获取用户信息
  static async getUser(address: string) {
    return this.query(QUERIES.GET_USER, { address: address.toLowerCase() })
  }

  // 获取黑客松列表
  static async getHackathons(params: { first?: number; skip?: number } = {}) {
    return this.query(QUERIES.GET_HACKATHONS, {
      first: params.first || 10,
      skip: params.skip || 0,
    })
  }

  // 获取项目列表
  static async getProjects(params: { first?: number; skip?: number } = {}) {
    return this.query(QUERIES.GET_PROJECTS, {
      first: params.first || 10,
      skip: params.skip || 0,
    })
  }
} 