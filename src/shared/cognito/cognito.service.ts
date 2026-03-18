import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_DVBcZf2hV'

export const cognitoService = {
  async createUser(params: {
    email: string
    name: string
    temporaryPassword?: string
  }): Promise<string> {
    const command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: params.email,
      TemporaryPassword: params.temporaryPassword,
      UserAttributes: [
        { Name: 'email', Value: params.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: params.name },
      ],
      MessageAction: params.temporaryPassword
        ? MessageActionType.SUPPRESS
        : undefined,
      DesiredDeliveryMediums: params.temporaryPassword ? [] : ['EMAIL'],
    })

    const result = await client.send(command)
    const sub = result.User?.Attributes?.find((a) => a.Name === 'sub')?.Value

    if (!sub) throw new Error('Cognito user created but sub not found')

    return sub
  },

  async deleteUser(email: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    })
    await client.send(command)
  },

  async userExists(email: string): Promise<boolean> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      })
      await client.send(command)
      return true
    } catch {
      return false
    }
  },
}
