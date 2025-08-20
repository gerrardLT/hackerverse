import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  UserRegistered,
  ProfileUpdated,
  HackathonCreated,
  HackathonUpdated,
  UserJoinedHackathon,
  UserLeftHackathon,
  ProjectSubmitted,
  ProjectUpdated,
  ScoreSubmitted
} from "../generated/HackXCore/HackXCore"
import {
  User,
  UserProfile,
  SocialLink,
  Hackathon,
  HackathonData,
  HackathonParticipant,
  Project,
  ProjectData,
  Score
} from "../generated/schema"

export function handleUserRegistered(event: UserRegistered): void {
  let user = new User(event.params.user.toHexString())
  user.address = event.params.user
  user.profileCID = event.params.profileCID
  user.createdAt = event.block.timestamp
  user.updatedAt = event.block.timestamp
  user.save()

  // 尝试从IPFS获取用户资料数据
  // 注意：这里需要实现IPFS数据获取逻辑
  // 由于AssemblyScript的限制，可能需要通过外部服务获取
}

export function handleProfileUpdated(event: ProfileUpdated): void {
  let user = User.load(event.params.user.toHexString())
  if (user) {
    user.profileCID = event.params.newProfileCID
    user.updatedAt = event.block.timestamp
    user.save()
  }
}

export function handleHackathonCreated(event: HackathonCreated): void {
  let hackathon = new Hackathon(event.params.hackathonId.toString())
  hackathon.hackathonId = event.params.hackathonId
  hackathon.organizer = event.params.organizer.toHexString()
  hackathon.dataCID = event.params.dataCID
  hackathon.createdAt = event.block.timestamp
  hackathon.updatedAt = event.block.timestamp
  hackathon.save()

  // 尝试从IPFS获取黑客松数据
}

export function handleHackathonUpdated(event: HackathonUpdated): void {
  let hackathon = Hackathon.load(event.params.hackathonId.toString())
  if (hackathon) {
    hackathon.dataCID = event.params.newDataCID
    hackathon.updatedAt = event.block.timestamp
    hackathon.save()
  }
}

export function handleUserJoinedHackathon(event: UserJoinedHackathon): void {
  let participant = new HackathonParticipant(
    event.params.hackathonId.toString() + "-" + event.params.participant.toHexString()
  )
  participant.hackathon = event.params.hackathonId.toString()
  participant.user = event.params.participant.toHexString()
  participant.joinedAt = event.block.timestamp
  participant.save()
}

export function handleUserLeftHackathon(event: UserLeftHackathon): void {
  let participantId = event.params.hackathonId.toString() + "-" + event.params.participant.toHexString()
  let participant = HackathonParticipant.load(participantId)
  if (participant) {
    participant.save() // 可以添加离开时间字段或删除记录
  }
}

export function handleProjectSubmitted(event: ProjectSubmitted): void {
  let project = new Project(event.params.hackathonId.toString() + "-" + event.params.participant.toHexString())
  project.creator = event.params.participant.toHexString()
  project.hackathon = event.params.hackathonId.toString()
  project.dataCID = event.params.projectCID
  project.createdAt = event.block.timestamp
  project.updatedAt = event.block.timestamp
  project.save()

  // 尝试从IPFS获取项目数据
}

export function handleProjectUpdated(event: ProjectUpdated): void {
  // 这里需要根据项目ID找到对应的项目记录
  // 由于事件中没有直接的项目ID，可能需要通过其他方式查找
  // 或者修改智能合约事件以包含更多信息
}

export function handleScoreSubmitted(event: ScoreSubmitted): void {
  let score = new Score(
    event.params.projectId.toString() + "-" + event.params.judge.toHexString()
  )
  score.project = event.params.projectId.toString()
  score.judge = event.params.judge.toHexString()
  score.score = event.params.score
  score.submittedAt = event.block.timestamp
  score.save()
} 