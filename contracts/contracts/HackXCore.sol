// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HackXCore
 * @dev HackX去中心化黑客松平台的核心智能合约
 * 管理用户、黑客松、项目和评分系统
 */
contract HackXCore is Ownable {
    // 状态变量
    uint256 private _hackathonIds = 0;
    uint256 private _projectIds = 0;
    
    // 用户资料CID映射
    mapping(address => string) public userProfiles;
    
    // 黑客松数据CID映射
    mapping(uint256 => string) public hackathonData;
    
    // 项目数据CID映射
    mapping(uint256 => string) public projectData;
    
    // 项目提交关系映射 (hackathonId => participant => projectCID)
    mapping(uint256 => mapping(address => string)) public projectSubmissions;
    
    // 黑客松参与者映射
    mapping(uint256 => address[]) public hackathonParticipants;
    
    // 用户参与的黑客松映射
    mapping(address => uint256[]) public userHackathons;
    
    // 黑客松组织者映射
    mapping(uint256 => address) public hackathonOrganizers;
    
    // 项目创建者映射
    mapping(uint256 => address) public projectCreators;
    
    // 评分映射 (projectId => judge => score)
    mapping(uint256 => mapping(address => uint256)) public projectScores;
    
    // 项目评委列表
    mapping(uint256 => address[]) public projectJudges;
    
    // 用户注册状态
    mapping(address => bool) public isUserRegistered;

    // 事件定义
    event UserRegistered(address indexed user, string profileCID);
    event ProfileUpdated(address indexed user, string newProfileCID);
    event HackathonCreated(uint256 indexed hackathonId, address indexed organizer, string dataCID);
    event HackathonUpdated(uint256 indexed hackathonId, string newDataCID);
    event UserJoinedHackathon(uint256 indexed hackathonId, address indexed participant);
    event UserLeftHackathon(uint256 indexed hackathonId, address indexed participant);
    event ProjectSubmitted(uint256 indexed hackathonId, address indexed participant, string projectCID);
    event ProjectUpdated(uint256 indexed projectId, string newDataCID);
    event ScoreSubmitted(uint256 indexed projectId, address indexed judge, uint256 score);

    // 修饰符
    modifier onlyRegisteredUser() {
        require(isUserRegistered[msg.sender], "User not registered");
        _;
    }

    modifier onlyHackathonOrganizer(uint256 hackathonId) {
        require(hackathonOrganizers[hackathonId] == msg.sender, "Not hackathon organizer");
        _;
    }

    modifier onlyProjectCreator(uint256 projectId) {
        require(projectCreators[projectId] == msg.sender, "Not project creator");
        _;
    }

    modifier hackathonExists(uint256 hackathonId) {
        require(bytes(hackathonData[hackathonId]).length > 0, "Hackathon does not exist");
        _;
    }

    modifier projectExists(uint256 projectId) {
        require(bytes(projectData[projectId]).length > 0, "Project does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 用户注册
     * @param profileCID 用户资料IPFS CID
     */
    function registerUser(string memory profileCID) external {
        require(!isUserRegistered[msg.sender], "User already registered");
        require(bytes(profileCID).length > 0, "Profile CID cannot be empty");
        
        userProfiles[msg.sender] = profileCID;
        isUserRegistered[msg.sender] = true;
        
        emit UserRegistered(msg.sender, profileCID);
    }

    /**
     * @dev 更新用户资料
     * @param newProfileCID 新的用户资料IPFS CID
     */
    function updateUserProfile(string memory newProfileCID) external onlyRegisteredUser {
        require(bytes(newProfileCID).length > 0, "Profile CID cannot be empty");
        
        userProfiles[msg.sender] = newProfileCID;
        
        emit ProfileUpdated(msg.sender, newProfileCID);
    }

    /**
     * @dev 创建黑客松
     * @param hackathonDataCID 黑客松数据IPFS CID
     * @return hackathonId 创建的黑客松ID
     */
    function createHackathon(string memory hackathonDataCID) external onlyRegisteredUser returns (uint256) {
        require(bytes(hackathonDataCID).length > 0, "Hackathon data CID cannot be empty");
        
        _hackathonIds++;
        uint256 hackathonId = _hackathonIds;
        
        hackathonData[hackathonId] = hackathonDataCID;
        hackathonOrganizers[hackathonId] = msg.sender;
        
        emit HackathonCreated(hackathonId, msg.sender, hackathonDataCID);
        
        return hackathonId;
    }

    /**
     * @dev 更新黑客松数据
     * @param hackathonId 黑客松ID
     * @param newDataCID 新的黑客松数据IPFS CID
     */
    function updateHackathon(uint256 hackathonId, string memory newDataCID) 
        external 
        onlyHackathonOrganizer(hackathonId) 
        hackathonExists(hackathonId) 
    {
        require(bytes(newDataCID).length > 0, "Hackathon data CID cannot be empty");
        
        hackathonData[hackathonId] = newDataCID;
        
        emit HackathonUpdated(hackathonId, newDataCID);
    }

    /**
     * @dev 加入黑客松
     * @param hackathonId 黑客松ID
     */
    function joinHackathon(uint256 hackathonId) external onlyRegisteredUser hackathonExists(hackathonId) {
        // 检查用户是否已经参与
        address[] storage participants = hackathonParticipants[hackathonId];
        for (uint i = 0; i < participants.length; i++) {
            require(participants[i] != msg.sender, "Already participating");
        }
        
        hackathonParticipants[hackathonId].push(msg.sender);
        userHackathons[msg.sender].push(hackathonId);
        
        emit UserJoinedHackathon(hackathonId, msg.sender);
    }

    /**
     * @dev 退出黑客松
     * @param hackathonId 黑客松ID
     */
    function leaveHackathon(uint256 hackathonId) external onlyRegisteredUser hackathonExists(hackathonId) {
        address[] storage participants = hackathonParticipants[hackathonId];
        bool found = false;
        
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == msg.sender) {
                // 移除参与者
                participants[i] = participants[participants.length - 1];
                participants.pop();
                found = true;
                break;
            }
        }
        
        require(found, "Not participating in this hackathon");
        
        // 从用户的黑客松列表中移除
        uint256[] storage userHacks = userHackathons[msg.sender];
        for (uint i = 0; i < userHacks.length; i++) {
            if (userHacks[i] == hackathonId) {
                userHacks[i] = userHacks[userHacks.length - 1];
                userHacks.pop();
                break;
            }
        }
        
        emit UserLeftHackathon(hackathonId, msg.sender);
    }

    /**
     * @dev 提交项目
     * @param hackathonId 黑客松ID
     * @param projectCID 项目IPFS CID
     */
    function submitProject(uint256 hackathonId, string memory projectCID) external onlyRegisteredUser hackathonExists(hackathonId) {
        require(bytes(projectCID).length > 0, "Project CID cannot be empty");
        
        projectSubmissions[hackathonId][msg.sender] = projectCID;
        
        emit ProjectSubmitted(hackathonId, msg.sender, projectCID);
    }

    /**
     * @dev 更新项目数据
     * @param projectId 项目ID
     * @param newDataCID 新的项目数据IPFS CID
     */
    function updateProject(uint256 projectId, string memory newDataCID) external onlyProjectCreator(projectId) projectExists(projectId) {
        require(bytes(newDataCID).length > 0, "Project data CID cannot be empty");
        
        projectData[projectId] = newDataCID;
        
        emit ProjectUpdated(projectId, newDataCID);
    }

    /**
     * @dev 提交评分
     * @param projectId 项目ID
     * @param judge 评委地址
     * @param score 评分
     */
    function submitScore(uint256 projectId, address judge, uint256 score) external onlyRegisteredUser projectExists(projectId) {
        require(score >= 0 && score <= 100, "Score must be between 0 and 100");
        
        projectScores[projectId][judge] = score;
        
        emit ScoreSubmitted(projectId, judge, score);
    }

    /**
     * @dev 获取用户资料CID
     * @param user 用户地址
     * @return 用户资料CID
     */
    function getUserProfile(address user) external view returns (string memory) {
        return userProfiles[user];
    }

    /**
     * @dev 获取黑客松数据CID
     * @param hackathonId 黑客松ID
     * @return 黑客松数据CID
     */
    function getHackathonData(uint256 hackathonId) external view returns (string memory) {
        return hackathonData[hackathonId];
    }

    /**
     * @dev 获取当前黑客松总数
     * @return 黑客松总数
     */
    function getHackathonCount() external view returns (uint256) {
        return _hackathonIds;
    }

    /**
     * @dev 获取黑客松参与者列表
     * @param hackathonId 黑客松ID
     * @return 参与者地址数组
     */
    function getHackathonParticipants(uint256 hackathonId) external view returns (address[] memory) {
        return hackathonParticipants[hackathonId];
    }

    /**
     * @dev 获取用户参与的黑客松列表
     * @param user 用户地址
     * @return 黑客松ID数组
     */
    function getUserHackathons(address user) external view returns (uint256[] memory) {
        return userHackathons[user];
    }

    /**
     * @dev 获取项目数据CID
     * @param projectId 项目ID
     * @return 项目数据CID
     */
    function getProjectData(uint256 projectId) external view returns (string memory) {
        return projectData[projectId];
    }

    /**
     * @dev 获取项目提交的CID
     * @param hackathonId 黑客松ID
     * @param participant 参与者地址
     * @return 项目CID
     */
    function getProjectSubmission(uint256 hackathonId, address participant) external view returns (string memory) {
        return projectSubmissions[hackathonId][participant];
    }

    /**
     * @dev 获取项目评分
     * @param projectId 项目ID
     * @param judge 评委地址
     * @return 评分
     */
    function getProjectScore(uint256 projectId, address judge) external view returns (uint256) {
        return projectScores[projectId][judge];
    }

    /**
     * @dev 获取当前项目总数
     * @return 项目总数
     */
    function getProjectCount() external view returns (uint256) {
        return _projectIds;
    }
} 