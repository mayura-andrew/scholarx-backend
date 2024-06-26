import {
  registerUser,
  loginUser,
  generateResetToken,
  resetPassword
} from './auth.service'
import { dataSource } from '../configs/dbConfig'
import Profile from './../entities/profile.entity'
import { getRepository } from 'typeorm'

jest.mock('bcrypt', () => ({
  hash: jest.fn(
    async (password: string) => await Promise.resolve(`hashed_${password}`)
  ),
  compare: jest.fn(
    async (password, hashedPassword) =>
      await Promise.resolve(password === hashedPassword)
  )
}))

interface PayloadType {
  userId: string
}

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload: PayloadType) => `mocked_token_${payload.userId}`)
}))

jest.mock('../configs/dbConfig', () => ({
  dataSource: {
    getRepository: jest.fn()
  }
}))

describe('registerUser', () => {
  it('should register a new user successfully', async () => {
    const mockProfileRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn(async (profile) => await Promise.resolve(profile))
    }

    ;(dataSource.getRepository as jest.Mock).mockReturnValueOnce(
      mockProfileRepository
    )

    const result = await registerUser(
      'newuser@example.com',
      'password123',
      'John',
      'Doe'
    )
    expect(result.message).toBe('Registration successful')
  })

  it('should return conflict status code for an existing user', async () => {
    const mockProfileRepository = {
      findOne: jest.fn().mockResolvedValue({})
    }

    ;(dataSource.getRepository as jest.Mock).mockReturnValueOnce(
      mockProfileRepository
    )

    const result = await registerUser(
      'existinguser@example.com',
      'password123',
      'John',
      'Doe'
    )

    expect(result.statusCode).toBe(409)
    expect(result.message).toBe('Email already exists')
    expect(result.profile).toBeUndefined()
  })

  it('should handle internal server error during registration', async () => {
    ;(dataSource.getRepository as jest.Mock).mockImplementation(() => {
      throw new Error('Test repository error')
    })

    const result = await registerUser(
      'testuser@example.com',
      'password123',
      'John',
      'Doe'
    )

    expect(result.statusCode).toBe(500)
    expect(result.message).toBe('Internal server error')
    expect(result.profile).toBeUndefined()
  })
})

describe('loginUser', () => {
  it('should return unauthorized status code for an invalid email or password', async () => {
    const mockProfileRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null)
    }

    ;(dataSource.getRepository as jest.Mock).mockReturnValueOnce(
      mockProfileRepository
    )

    const result = await loginUser('nonexistentuser@example.com', 'password123')

    expect(result.statusCode).toBe(401)
    expect(result.message).toBe('Invalid email or password')
    expect(result.user).toBeUndefined()
  })

  it('should return unauthorized status code for an incorrect password', async () => {
    const mockProfileRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        uuid: 'user_uuid',
        password: 'hashed_incorrect_password'
      })
    }

    ;(dataSource.getRepository as jest.Mock).mockReturnValueOnce(
      mockProfileRepository
    )

    const result = await loginUser('existinguser@example.com', 'password123')

    expect(result.statusCode).toBe(401)
    expect(result.message).toBe('Invalid email or password')
    expect(result.user).toBeUndefined()
  })

  it('should handle an internal server error during login', async () => {
    ;(dataSource.getRepository as jest.Mock).mockImplementation(() => {
      throw new Error('Test repository error')
    })

    const result = await loginUser('testuser@example.com', 'password123')

    expect(result.statusCode).toBe(500)
    expect(result.message).toBe('Internal server error')
    expect(result.user).toBeUndefined()
  })

  it('should return unauthorized status code for an invalid email or password', async () => {
    const mockError = new Error('Test repository error')
    const mockProfileRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockRejectedValue(mockError)
    }

    ;(dataSource.getRepository as jest.Mock).mockReturnValueOnce(
      mockProfileRepository
    )

    const result = await loginUser('nonexistentuser@example.com', 'password123')

    expect(result.statusCode).toBe(500)
    expect(result.message).toBe('Internal server error')
    expect(result.user).toBeUndefined()
  })
})

jest.mock('typeorm', () => ({
  getRepository: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    save: jest.fn()
  })
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword')
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('validToken'),
  verify: jest.fn().mockReturnValue({ uuid: '123' })
}))

describe('AuthService', () => {
  it('should generate a reset token', async () => {
    getRepository(Profile).findOne = jest.fn().mockResolvedValue({
      uuid: '123',
      password: 'password'
    })

    const result = await generateResetToken('test@example.com')

    expect(result.statusCode).toEqual(200)
    expect(result.message).toEqual('Token generated')
    expect(result.token).toBeDefined()
  })

  it('should reset password', async () => {
    getRepository(Profile).findOne = jest.fn().mockResolvedValue({
      uuid: '123',
      password: 'password'
    })

    const result = await resetPassword('validToken', 'newPassword')

    expect(result.statusCode).toEqual(200)
    expect(result.message).toEqual('Password reset successful')
  })
})
