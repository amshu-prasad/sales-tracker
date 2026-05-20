import logging
import boto3
import json
from datetime import date
# import pandas as pd
from ast import literal_eval
from app.config.EnvConfig import access_key_id, secret_access_key, region, bucket_name

logger = logging.getLogger("main_project")
class aws_s3_access_class:

    def __init__(self):
        self.s3_client = boto3.client('s3',aws_access_key_id=access_key_id,
                        aws_secret_access_key=secret_access_key,
                        region_name=region)
        
        self.athena_client = boto3.client('athena',
                          aws_access_key_id=access_key_id,
                          aws_secret_access_key=secret_access_key,
                          region_name=region)
    
    def run_athena_query(self, query: str):
            
        # Execution parameters
        query_params = {
            'QueryString': query,
            'ResultConfiguration': {
                'OutputLocation': 's3://smart-ta-test/athena-query-results/'  # Replace with your S3 bucket and path
            }
        }
        # Start query execution
        response = self.athena_client.start_query_execution(**query_params)

        # Get query execution ID
        query_execution_id = response['QueryExecutionId']

        # Wait for query execution to complete
        query_status = None
        while query_status not in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            query_status = self.athena_client.get_query_execution(QueryExecutionId=query_execution_id)['QueryExecution']['Status']['State']

        # Check if query was successful
        if query_status != 'SUCCEEDED':
            raise ValueError(f"Query {query_status}")
            
        # Get query results
        result_response = self.athena_client.get_query_results(QueryExecutionId=query_execution_id)
        #print('result_response',result_response)
        # Convert results to DataFrame using Pandas
        columns = [col['Label'] for col in result_response['ResultSet']['ResultSetMetadata']['ColumnInfo']]
        rows = []
        for row in result_response['ResultSet']['Rows'][1:]:
            rows.append([val['VarCharValue'] for val in row['Data']])

        return columns, rows
    
    def get_object_from_s3(self, bucket_name, key):
        response = self.s3_client.get_object(Bucket=bucket_name, Key=key)
        return response

    def list_objects_from_s3(self, Bucket, Prefix):
        response = self.s3_client.list_objects_v2(Bucket=Bucket, Prefix=Prefix)
        return response

    def save_json_in_s3(self, bucket_name, json_save_path, json_body):
        response = self.s3_client.put_object(
                    Bucket=bucket_name,
                    Key=json_save_path,  # Specify the file name in the S3 bucket
                    Body=json_body
                )
        
        return response

    def upload_file_to_s3(self, bucket_name, key, file_content, content_type):
        response = self.s3_client.put_object(Bucket=bucket_name,
            Key=key,
            Body=file_content,
            ContentType=content_type)
        
        return response

    def delete_object_from_s3(self, bucket_name, key):
        self.s3_client.delete_object(Bucket=bucket_name, Key=key)


    def save_pdf_in_s3(self,file, pdf_type, job_id=None):
        file_name = file.name
        s3_file_path = ""
        if pdf_type == "cv" :
            s3_file_path = f'CV_collection/tmp_uploaded_CVs/{file_name}' 
        else:
            s3_file_path = f'JD_collection/tmp_uploaded_JDs/{job_id}_{file_name}'
        # Upload the file
        self.s3_client.upload_file(file_name, bucket_name, s3_file_path)

    def save_files_to_s3(self, files, entity_type, job_id=None):
        print(files)
        if entity_type == "cv":
            for i in range(0,len(files)):
                self.save_pdf_in_s3(files[i], "cv")
        else:
            self.save_pdf_in_s3(files, "jd", job_id)


    def get_json_from_s3(self,file_key):
      response = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
      json_data = json.loads(response['Body'].read().decode('utf-8'))
      return json_data
    
    # def get_job_family_count(self):
    #     response = self.s3_client.get_object(Bucket = 'smart-ta-test', Key = 'JD_collection/jd_data_updated.csv')
    #     jds = pd.read_csv(response['Body'], sep ='|')
    #     jf = list(set(jds.job_family))
    #     job_family_count ={}
    #     for j in jf:
    #         job_family_count[j]=0
    #     response = self.s3_client.list_objects_v2(Bucket='smart-ta-test', Prefix='ctp_json/')
    #     files = [content['Key'] for content in response.get('Contents', []) if content['Key'].endswith('.json')]
        
    #     for i,fil in enumerate(files):        
    #         json_data = self.get_json_from_s3(fil)
    #         job_family_count[json_data['job_family']] = job_family_count[json_data['job_family']]+1
        
    #     return job_family_count
    
    # def get_count_from_s3(self):
    #     response = self.s3_client.list_objects_v2(Bucket='smart-ta-test', Prefix='Linkedin_scrapper/json_file/')
    #     ln_files = [content['Key'] for content in response.get('Contents', []) if content['Key'].endswith('.json')]
        
    #     ## SQL Query ##
    #     q1 = """ select count(*) from "smart-ta"."ctp" """             
    #     total_profiles = self.run_query(q1)
    #     #st.write(total_profiles.columns)
        
    #     count_df = pd.DataFrame(columns=['Central Profile Pool', 'Unprocessed Profile Pool'])
    #     count_df.at[0,'Central Profile Pool'] = total_profiles.iloc[0]['_col0']
    #     count_df.at[0,'Unprocessed Profile Pool'] = len(ln_files)
    #     return count_df
    
    # query athena
    def run_validation_query(self, query):    
        # Execution parameters
        query_params = {
            'QueryString': query,
            'ResultConfiguration': {
                'OutputLocation': 's3://smart-ta-test/athena-query-results/'  # Replace with your S3 bucket and path
            }
        }
        # Start query execution
        response = self.athena_cient.start_query_execution(**query_params)

        # Get query execution ID
        query_execution_id = response['QueryExecutionId']

        # Wait for query execution to complete
        query_status = None
        while query_status not in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
            query_status = self.athena_cient.get_query_execution(QueryExecutionId=query_execution_id)['QueryExecution']['Status']['State']
        return query_status

    def upload_pdf(self, pdf_buffer, file_key):
        self.s3_client.upload_fileobj(pdf_buffer, Bucket=bucket_name, Key=file_key, ExtraArgs={'ContentType': 'application/pdf'})
        return
    
    def upload_file(self, bucket_name, file_key, file_content, content_type):
        try:
            # Upload the file to S3
            response = self.s3_client.put_object(
                Bucket=bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=content_type
            )
            
            # Return the response from the upload
            return response
        
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        
    def upload_docx(self, docx_buffer, file_key):
        """
        Upload a DOCX file to S3 from a BytesIO buffer.
        """
        self.s3_client.upload_fileobj(
            docx_buffer,
            Bucket=bucket_name,
            Key=file_key,
            ExtraArgs={'ContentType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
        )