import { Column, Entity, ManyToOne } from 'typeorm'
import Mentor from './mentor.entity'
import profileEntity from './profile.entity'
import { ApplicationStatus, StatusUpdatedBy } from '../enums'
import BaseEntity from './baseEntity'

@Entity('mentee')
class Mentee extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING
  })
  state: ApplicationStatus

  @Column({ type: 'enum', enum: StatusUpdatedBy, nullable: true })
  status_updated_by!: StatusUpdatedBy

  @Column({ type: 'timestamp', nullable: true })
  status_updated_date!: Date

  @Column({ type: 'json' })
  application: Record<string, unknown>

  @Column({ type: 'bigint', nullable: true, default: null })
  certificate_id!: bigint

  @Column({ default: null, nullable: true })
  journal!: string

  @ManyToOne(() => profileEntity, (profile) => profile.mentee)
  profile: profileEntity

  @ManyToOne(() => Mentor, (mentor) => mentor.mentees)
  mentor: Mentor

  constructor(
    state: ApplicationStatus,
    application: Record<string, unknown>,
    profile: profileEntity,
    mentor: Mentor
  ) {
    super()
    this.state = state || ApplicationStatus.PENDING
    this.application = application
    this.profile = profile
    this.mentor = mentor
  }
}

export default Mentee
