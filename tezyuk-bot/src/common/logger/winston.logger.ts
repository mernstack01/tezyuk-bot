import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { format, transports } from 'winston';

export const createWinstonLogger = () => ({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.ms(),
        nestWinstonModuleUtilities.format.nestLike('YukMarkaz', {
          prettyPrint: true,
        }),
      ),
    }),
  ],
});
